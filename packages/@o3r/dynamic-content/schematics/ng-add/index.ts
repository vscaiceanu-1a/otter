import type { Rule } from '@angular-devkit/schematics';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { NgAddSchematicsSchema } from './schema';

/**
 * Add Otter dynamic-content to an Angular Project
 *
 * @param options
 */
export function ngAdd(options: NgAddSchematicsSchema): Rule {
  /* ng add rules */
  return async (tree) => {
    const { addDependenciesInPackageJson, getWorkspaceConfig } = await import('@o3r/schematics');
    const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }));
    const workspaceProject = options.projectName ? getWorkspaceConfig(tree)?.projects[options.projectName] : undefined;
    const workingDirectory = workspaceProject?.root;

    return addDependenciesInPackageJson([packageJson.name!], {...options, workingDirectory, version: packageJson.version});
  };
}
