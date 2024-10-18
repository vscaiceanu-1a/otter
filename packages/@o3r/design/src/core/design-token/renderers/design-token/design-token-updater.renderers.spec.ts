import {
  promises as fs
} from 'node:fs';
import {
  resolve
} from 'node:path';
import type {
  DesignTokenSpecification
} from '../../design-token-specification.interface';
import type {
  DesignTokenVariableSet
} from '../../parsers';
import * as parser from '../../parsers/design-token.parser';
import {
  getDesignTokenStyleContentUpdater
} from './design-token-updater.renderers';

describe('getDesignTokenStyleContentUpdater', () => {
  let exampleVariable!: DesignTokenSpecification;
  let designTokens!: DesignTokenVariableSet;

  beforeAll(async () => {
    const file = await fs.readFile(resolve(__dirname, '../../../../../testing/mocks/design-token-theme.json'), { encoding: 'utf-8' });
    exampleVariable = { document: JSON.parse(file) };
    designTokens = parser.parseDesignToken(exampleVariable);
  });

  test('should render valid JSON object', () => {
    const renderer = getDesignTokenStyleContentUpdater();
    const variable = designTokens.get('example.var1');

    const variables = ['{"var1": {"value": "#000"}}', '{"var2": {"value": "#fff"}}'];
    const result = renderer(variables, '/');

    expect(variable).toBeDefined();
    expect(result).toBeDefined();
    expect(() => JSON.parse(result)).not.toThrow();
    expect(result.replace(/[\n\r ]*/g, '')).toContain(variables[0].replace(/^\{(.*)}$/, '$1').replace(/[\n\r ]*/g, ''));
    expect(result.replace(/[\n\r ]*/g, '')).toContain(variables[1].replace(/^\{(.*)}$/, '$1').replace(/[\n\r ]*/g, ''));
  });

  test('should merge node', () => {
    const renderer = getDesignTokenStyleContentUpdater();
    const variable = designTokens.get('example.var1');

    const variables = ['{"node1": {"$value": "#000"}}', '{"node1": {"var1": {"$value": "#fff"}}}'];
    const result = renderer(variables, '/');

    expect(variable).toBeDefined();
    expect(result).toBeDefined();
    expect(JSON.parse(result).node1.$value).toBeDefined();
    expect(JSON.parse(result).node1.var1.$value).toBeDefined();
  });
});
