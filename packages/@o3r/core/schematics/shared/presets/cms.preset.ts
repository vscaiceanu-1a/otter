import {
  chain,
} from '@angular-devkit/schematics';
import {
  setupSchematicsParamsForProject,
  WorkspaceSchematics,
} from '@o3r/schematics';
import {
  defaultPresetRuleFactory,
} from './helpers';
import type {
  PresetOptions,
} from './preset.interface';

/**
 * Preset Installing the minimum modules to fully administrated the application via CMS
 * @param options
 */
export function cmsPreset(options: PresetOptions) {
  const modules = [
    '@o3r/localization',
    '@o3r/styling',
    '@o3r/components',
    '@o3r/configuration',
    '@o3r/dynamic-content',
    '@o3r/rules-engine'
  ];

  const rule = defaultPresetRuleFactory(modules, options);

  return {
    modules,
    rule: chain([
      setupSchematicsParamsForProject({ '*:ng-add': { enableMetadataExtract: true } } as WorkspaceSchematics, options.projectName),
      rule
    ])
  };
}
