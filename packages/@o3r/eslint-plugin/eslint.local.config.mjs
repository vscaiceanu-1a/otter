import {
  dirname,
} from 'node:path';
import {
  fileURLToPath,
} from 'node:url';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
// __dirname is not defined in ES module scope
const __dirname = dirname(__filename);

export default [
  {
    name: '@o3r/eslint-plugin/projects',
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          'tsconfig.build.json',
          'tsconfig.builders.json',
          'tsconfig.spec.json',
          'tsconfig.eslint.json'
        ]
      },
      globals: {
        ...globals.node
      }
    }
  },
  {
    name: '@o3r/eslint-plugin/tests',
    files: ['**/*.spec.ts'],
    rules: {
      'import/newline-after-import': 'off'
    }
  }
];
