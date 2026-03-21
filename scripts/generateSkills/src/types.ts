/**
 * Core interfaces for the skill catalog generation pipeline.
 */

/** A single exported abstraction in a catalog */
export interface CatalogEntry {
    /** Class name, e.g. "CreateTenantUseCase" */
    className: string;
    /** Import path, e.g. "webiny/api/tenancy" */
    importPath: string;
    /** Package-resolvable path to the source file */
    sourceFilePath: string;
}

/** Discovered export before source resolution */
export interface DiscoveredExport {
    className: string;
    importPath: string;
}

/** Category info derived from import path */
export interface CategoryInfo {
    id: string;
    label: string;
    description: string;
}

/** CLI options */
export interface CliOptions {
    check?: boolean;
    output?: string;
    category?: string;
    verbose?: boolean;
    repoRoot?: string;
}
