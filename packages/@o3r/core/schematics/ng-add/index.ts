import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { askConfirmation } from '@angular/cli/src/utilities/prompt';
import {
  createSchematicWithMetricsIfInstalled,
  displayModuleListRule,
  getWorkspaceConfig,
  isPackageInstalled,
  ngAddPackages,
  registerPackageCollectionSchematics,
  setupSchematicsDefaultParams
} from '@o3r/schematics';
import { NodeDependencyType } from '@schematics/angular/utility/dependencies';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PackageJson } from 'type-fest';
import { getExternalPreset, presets } from '../shared/presets';
import { prepareProject } from './project-setup/index';
import type { NgAddSchematicsSchema } from './schema';

/**
 * Add Otter library to an Angular Project
 * @param options
 */
function ngAddFn(options: NgAddSchematicsSchema): Rule {
  const corePackageJsonContent = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), {encoding: 'utf-8'})) as PackageJson;
  const schematicsDependencies = ['@o3r/schematics'];

  return async (tree: Tree, context: SchematicContext): Promise<Rule> => {
    // check if the workspace package is installed, if not installed and we are in workspace context, we install
    const workspacePackageName = '@o3r/workspace';
    if (!options.projectName && !isPackageInstalled(workspacePackageName)) {
      schematicsDependencies.push(workspacePackageName);
    }
    const workspaceProject = options.projectName ? getWorkspaceConfig(tree)?.projects[options.projectName] : undefined;
    const workingDirectory = workspaceProject?.root || '.';

    return () => chain([
      ngAddPackages(
        schematicsDependencies,
        {
          dependencyType: NodeDependencyType.Dev,
          version: corePackageJsonContent.version,
          workingDirectory,
          skipConfirmation: true,
          projectName: options.projectName
        }
      ),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      setupSchematicsDefaultParams({ '*:ng-add': { registerDevtool: options.withDevtool } }),
      ...schematicsDependencies.map((dep) => externalSchematic(dep, 'ng-add', options)),
      options.projectName ? prepareProject(options) : noop(),
      registerPackageCollectionSchematics(corePackageJsonContent),
      async (t, c) => {
        const { preset, externalPresets, ...forwardOptions } = options;
        const presetRunner = await presets[preset]({ projectName: forwardOptions.projectName, forwardOptions });
        const externalPresetRunner = externalPresets ? await getExternalPreset(externalPresets, t, c)?.({ projectName: forwardOptions.projectName, forwardOptions }) : undefined;
        const modules = [...new Set([...(presetRunner.modules || []), ...(externalPresetRunner?.modules || [])])];
        if (modules.length) {
          c.logger.info(`The following modules will be installed: ${modules.join(', ')}`);
          if (c.interactive && !await askConfirmation('Would you like to process to the setup of these modules?', true)) {
            return;
          }
        }
        return () => chain([
          presetRunner.rule,
          externalPresetRunner?.rule || noop()
        ])(t, c);
      },
      displayModuleListRule({ packageName: options.projectName })
    ])(tree, context);
  };
}

/**
 * Add Otter library to an Angular Project
 * @param options
 */
export const ngAdd = createSchematicWithMetricsIfInstalled(ngAddFn);
