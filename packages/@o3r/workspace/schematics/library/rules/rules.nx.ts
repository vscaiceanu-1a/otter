import {
  readFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  apply,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  move,
  renameTemplateFiles,
  Rule,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  findConfigFileRelativePath,
  getPackageManagerRunner,
  getWorkspaceConfig,
} from '@o3r/schematics';
import type {
  PackageJson,
} from 'type-fest';
import type {
  NgGenerateModuleSchema,
} from '../schema';
import {
  updateNgPackagrFactory,
  updatePackageDependenciesFactory,
} from './shared';

/**
 * Save the content of files before the process of Nx generation
 * @param tree
 */
const savePreCommandContent = (tree: Tree) => {
  const files = [
    '/.vscode/extensions.json',
    '.gitignore',
    '.prettierignore',
    '.prettierrc',
    'jest.preset.js',
    'nx.json',
    'package.json'
  ];

  return files.reduce<Record<string, Buffer | null>>((acc, file) => {
    if (!tree.exists(file)) {
      acc[file] = null;
      return acc;
    }
    acc[file] = tree.read(file);
    return acc;
  }, {});
};

/**
 * Restore the file saved
 * @param mem
 */
const restoreFiles = (mem: Record<string, Buffer | null>) => (tree: Tree) => {
  Object.entries(mem)
    .forEach(([file, content]) => {
      if (content === null) {
        if (tree.exists(file)) {
          tree.delete(file);
        }
      } else {
        tree.overwrite(file, content);
      }
    });
  return tree;
};

/**
 * generate the rules to adapt the library generated by nx cli
 * @param options
 */
export function nxGenerateModule(options: NgGenerateModuleSchema & { packageJsonName: string }): Rule {
  /**
   * Determine the path where NX schematic will generate the package
   * @param tree
   */
  const determineNxTargetFolder = (tree: Tree) => {
    const { workspaceLayout } = tree.readJson('/nx.json') as { workspaceLayout: { libsDir: string } };
    return path.posix.join(workspaceLayout.libsDir, options.name);
  };

  /**
   * Update Nx templates
   * @param tree File tree
   * @param context Context of the schematics
   */
  const updateNxTemplate: Rule = (tree, context) => {
    const rules: Rule[] = [];
    let targetPath = determineNxTargetFolder(tree);

    if (options.path) {
      rules.push(move(targetPath, options.path));
      targetPath = options.path;
    }

    const o3rCorePackageJsonPath = path.resolve(__dirname, '..', '..', '..', 'package.json');
    const o3rCorePackageJson: PackageJson & { generatorDependencies?: Record<string, string> } = JSON.parse(readFileSync(o3rCorePackageJsonPath).toString());
    const otterVersion = o3rCorePackageJson.dependencies!['@o3r/schematics'];

    const templateNx = apply(url('./templates/nx'), [
      template({
        ...options,
        path: targetPath,
        projectRoot: path.posix.resolve(targetPath, options.name),
        otterVersion,
        tsconfigBasePath: findConfigFileRelativePath(tree, ['tsconfig.base.json', 'tsconfig.json'], targetPath),
        runner: getPackageManagerRunner(getWorkspaceConfig(tree))
      }),
      renameTemplateFiles(),
      move(targetPath)
    ]);
    rules.push(mergeWith(templateNx, MergeStrategy.Overwrite));

    return chain([
      ...rules,
      updatePackageDependenciesFactory(targetPath, otterVersion!, o3rCorePackageJson, options),
      updateNgPackagrFactory(targetPath),
      (t) => {
        const packageJson = t.readJson(path.posix.join(targetPath, 'package.json')) as PackageJson;
        packageJson.name = options.packageJsonName;
        packageJson.scripts ||= {};
        packageJson.scripts.ng = 'nx';
        t.overwrite(path.posix.join(targetPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        return t;
      }
    ])(tree, context);
  };

  const nxCliUpdate: Rule = (tree, context) => {
    const mem: Record<string, Buffer | null> = savePreCommandContent(tree);
    const config = {
      name: options.name,
      importPath: options.packageJsonName,
      buildable: true,
      publishable: true
    } as const;
    return chain([
      (t, c) => externalSchematic('@nx/angular', 'library', config)(t, c),
      restoreFiles(mem),
      updateNxTemplate
    ])(tree, context);
  };

  return nxCliUpdate;
}
