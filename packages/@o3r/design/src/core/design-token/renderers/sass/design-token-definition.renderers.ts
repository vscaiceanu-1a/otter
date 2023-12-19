import type { DesignTokenVariableStructure, TokenKeyRenderer, TokenValueRenderer } from '../../parsers/design-token-parser.interface';
import type { TokenDefinitionRenderer } from '../design-token.renderer.interface';
import { getCssTokenValueRenderer } from '../css/design-token-value.renderers';
import { isO3rPrivateVariable } from '../design-token.renderer.helpers';

interface SassTokenDefinitionRendererOptions {
  /**
   * Determine if the variable is private and should not be rendered
   * @default {@see isO3rPrivateVariable}
   */
  isPrivateVariable?: (variable: DesignTokenVariableStructure) => boolean;

  /** Custom Design Token value renderer */
  tokenValueRenderer?: TokenValueRenderer;

  /**
   * Renderer the name of the Sass Variable (without initial $)
   * @default {@see fromCssVarNameToSassVar}
   */
  tokenVariableNameRenderer?: TokenKeyRenderer;
}

const fromCssVarNameToSassVar: TokenKeyRenderer = (variable) => {
  const tokens = variable.getKey().split('-');
  return tokens[0] + tokens.slice(1).map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join('');
};

/**
 * Retrieve the Design Token Variable renderer for Sass
 * @param options
 * @returns
 */
export const getSassTokenDefinitionRenderer = (options?: SassTokenDefinitionRendererOptions): TokenDefinitionRenderer => {
  const tokenValueRenderer = options?.tokenValueRenderer || getCssTokenValueRenderer();
  const keyRenderer = options?.tokenVariableNameRenderer || fromCssVarNameToSassVar;
  const isPrivateVariable = options?.isPrivateVariable || isO3rPrivateVariable;

  const renderer = (variable: DesignTokenVariableStructure, variableSet: Map<string, DesignTokenVariableStructure>) => {
    return `$${isPrivateVariable(variable) ? '_' : ''}${variable.getKey(keyRenderer)}: ${ tokenValueRenderer(variable, variableSet) };`;
  };
  return renderer;
};