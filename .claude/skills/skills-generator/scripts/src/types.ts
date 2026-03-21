/**
 * Core interfaces for the skill generation pipeline.
 *
 * Note: ts-morph types (SourceFile, Project) are used as `any` in this file
 * to avoid import issues with prettier. The actual types are enforced at usage sites.
 */

/** Derived from the first path segment of the webiny export path */
export type Layer = "api" | "admin" | "infra" | "cli";

/** What a plugin returns from discovery */
export interface DiscoveredExport {
  className: string;
  importPath: string;
  sourceModuleSpecifier: string;
  pluginId: string;
  layer: Layer;
}

/** What a plugin returns from name parsing */
export interface ParsedName {
  entity: string;
  timing?: string;
  operation: string;
  skillName: string;
  humanName: string;
}

/** What a plugin returns from type extraction */
export interface ExtractedTypes {
  typeBlock: string;
  typeHash: string;
  sourceFiles: { package: string; files: string[] }[];
}

/** Final assembled data for rendering */
export interface SkillData {
  className: string;
  importPath: string;
  pluginId: string;
  layer: Layer;
  skillName: string;
  humanName: string;
  entity: string;
  timing?: string;
  operation: string;
  typeBlock: string;
  typeHash: string;
  sourceFiles: { package: string; files: string[] }[];
  category: string;
  categoryLabel: string;
  description: string;
  templateData: Record<string, unknown>;
}

/** Skill manifest stored in skill.manifest.json */
export interface SkillManifest {
  skill: string;
  generated: boolean;
  generatedAt: string;
  generatedFromRef?: string;
  abstractionType: string;
  className: string;
  importPath: string;
  sources: { package: string; files: string[] }[];
  typeHash: string;
}

/** The plugin interface — each abstraction type implements this */
export interface AbstractionPlugin {
  /** Unique identifier, e.g. "event-handler", "use-case" */
  id: string;

  /** Human label for reports, e.g. "EventHandler" */
  label: string;

  /** Which barrel file export paths this plugin scans */
  exportPathPatterns: string[];

  /** Given an export name, does this plugin claim it? */
  matches(exportName: string): boolean;

  /** Parse the class name into entity/timing/operation/skillName */
  parseName(className: string, importPath: string, layer: Layer): ParsedName;

  /** Extract types from the source via ts-morph */
  extractTypes(
    className: string,
    sourceFile: any,
    project: any,
    utils: any
  ): ExtractedTypes;

  /** Handlebars template filename (relative to templates/) */
  templateName: string;

  /** Compute plugin-specific template variables */
  computeTemplateData(
    parsed: ParsedName,
    types: ExtractedTypes,
    importPath: string,
    layer: Layer
  ): Record<string, unknown>;
}

/** CLI options */
export interface CliOptions {
  since?: string;
  check?: boolean;
  output?: string;
  plugin?: string;
  verbose?: boolean;
}

/** Change detection result */
export interface ChangeReport {
  added: DiscoveredExport[];
  changed: DiscoveredExport[];
  removed: string[];
  unchanged: DiscoveredExport[];
}
