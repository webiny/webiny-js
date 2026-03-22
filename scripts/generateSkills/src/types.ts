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
    /** JSDoc description, empty if none */
    description: string;
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
    /** Additional "How to Use" items merged from pattern-matched rules */
    howToUse?: string[];
}

/** CLI options */
export interface CliOptions {
    check?: boolean;
    output?: string;
    category?: string;
    format?: "table" | "cards";
    verbose?: boolean;
    repoRoot?: string;
}
