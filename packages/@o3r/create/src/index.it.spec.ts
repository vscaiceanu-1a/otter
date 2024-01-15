import {
  getDefaultExecSyncOptions,
  getPackageManager,
  getYarnVersionFromRoot,
  packageManagerCreate,
  packageManagerExec,
  packageManagerInstall,
  prepareTestEnv,
  setupLocalRegistry
} from '@o3r/test-helpers';
import * as path from 'node:path';

const projectName = 'test-create-app';
let baseFolderPath: string;
let appPackagePath: string;
const execAppOptions = getDefaultExecSyncOptions();
const packageManager = getPackageManager();

describe('Create new otter project command', () => {
  setupLocalRegistry();
  beforeEach(async () => {
    const isYarnTest = packageManager.startsWith('yarn');
    const yarnVersion = isYarnTest ? getYarnVersionFromRoot(process.cwd()) || 'latest' : undefined;
    baseFolderPath = (await prepareTestEnv(projectName, {type: 'blank', yarnVersion })).workspacePath;
    appPackagePath = path.join(baseFolderPath, projectName);
    execAppOptions.cwd = baseFolderPath;
  });

  test('should generate a project with an application', () => {
    expect(() => packageManagerCreate({script: '@o3r', args: [projectName]}, execAppOptions)).not.toThrow();
    expect(() => packageManagerInstall({ ...execAppOptions, cwd: appPackagePath })).not.toThrow();
    expect(() => packageManagerExec({ script: 'ng', args: ['g', 'application', 'my-app'] }, { ...execAppOptions, cwd: appPackagePath })).not.toThrow();
    expect(() => packageManagerExec({ script: 'ng', args: ['build', 'my-app']}, { ...execAppOptions, cwd: appPackagePath })).not.toThrow();
  });
});
