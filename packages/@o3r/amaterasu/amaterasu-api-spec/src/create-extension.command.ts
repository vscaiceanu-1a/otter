import {
  promises as fs,
  readFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  Context,
  promiseSpawn,
} from '@ama-terasu/core';

/** Option to create an application */
export interface CreateExtensionOptions {
  /** Extension Name */
  name: string;
  /** Path of the folder to create the extension */
  path: string;
  /**
   * Set default options instead of requiring input
   * @default false
   */
  yes?: boolean;
  /** Digital Api type */
  type: string;
  /** Version of the base digital spec */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- format imposed
  'spec-version': string;
}

/**
 * Create an Otter Extension
 * @param context Context of the command
 * @param options Options
 */
export const createExtension = async (context: Context, options: CreateExtensionOptions) => {
  const { logger } = context;
  const cwd = path.resolve(process.cwd(), options.path);

  const { version } = JSON.parse(readFileSync(path.resolve(__dirname, '..', 'package.json'), { encoding: 'utf8' }));

  const npmrcFile = 'tmp.npmrc';
  const deps = {
    '@ama-sdk/schematics': version === '0.0.0-placeholder' ? 'latest' : version,
    yo: 'latest'
  };

  await context.getSpinner('Generating extension module...').fromPromise(
    (async () => {
      await promiseSpawn('npm init -y', { cwd, stderrLogger: (...args: any[]) => logger.debug(...args), logger });
      await promiseSpawn(
        `npm install --userconfig ${npmrcFile} --include dev ${Object.entries<string>(deps).map(([n, v]) => `${n}@${v}`).join(' ')}`,
        { cwd, stderrLogger: (...args: any[]) => logger.debug(...args), logger }
      );

      await promiseSpawn(
        // eslint-disable-next-line @stylistic/max-len -- keep the command on the same line
        `npx -p @angular-devkit/schematics-cli schematics @ama-sdk/schematics:api-extension --name "${options.name}" --core-type ${options.type.replace(/^core-/, '')} --core-version "${options['spec-version']}"`,
        { cwd, stderrLogger: (...args: any[]) => logger.debug(...args), logger }
      );
    })(),
    // TODO: simplify to the following line when migrated to schematics generation

    // promiseSpawn(
    // eslint-disable-next-line @stylistic/max-len -- keep the command on the same line
    //   `npx ${Object.entries(deps).map(([n, v]) => `-p ${n}@${v}`).join(' ')} --userconfig ${npmrcFile} yo${options.yes ? ' --force=true' : ''} @ama-sdk/sdk:api-extension --name "${options.name}" --coreType ${options.type.replace(/^core-/, '')} --coreVersion "${options['spec-version']}"`,
    //   { cwd, stderrLogger: logger.debug, logger }
    // ),
    `API Extension generated (in ${cwd})`
  );

  await context.getSpinner('Clean up setup materials').fromPromise(
    Promise.all([
      fs.unlink(path.resolve(cwd, npmrcFile)),
      fs.rm(path.resolve(cwd, 'node_modules'), { force: true, recursive: true }),
      options.path === '.' ? undefined : fs.unlink(path.resolve(cwd, 'package.json'))
    ]),
    'Setup material removed'
  );

  logger.info(`API extension created in ${cwd}`);
};
