import fs from "fs";
import path from "path";
import readJsonSync from "read-json-sync";

export interface TsConfigPaths {
    [key: string]: string[];
}

export interface TsConfigCompilerOptions {
    baseUrl?: string;
    paths?: TsConfigPaths;
}

export interface TsConfig {
    compilerOptions?: TsConfigCompilerOptions;
    extends?: string;
}

export class TsConfigPathResolver {
    private pathMappings: Map<string, string[]> = new Map();
    private baseUrl: string;

    constructor(tsConfigPath: string, projectRoot: string) {
        this.baseUrl = projectRoot;
        this.loadTsConfig(tsConfigPath, projectRoot);
    }

    private loadTsConfig(tsConfigPath: string, projectRoot: string): void {
        if (!fs.existsSync(tsConfigPath)) {
            return;
        }

        let tsConfig: TsConfig;
        try {
            tsConfig = readJsonSync(tsConfigPath) as TsConfig;
        } catch (error) {
            throw new Error(
                `Failed to parse tsconfig.json at ${tsConfigPath}: ${(error as Error).message}`
            );
        }

        // Handle extends - process parent first so child can override.
        if (tsConfig.extends) {
            const extendedPath = path.resolve(path.dirname(tsConfigPath), tsConfig.extends);
            this.loadTsConfig(extendedPath, projectRoot);
        }

        // Process compiler options - these override parent settings.
        if (tsConfig.compilerOptions) {
            if (tsConfig.compilerOptions.baseUrl) {
                this.baseUrl = path.resolve(
                    path.dirname(tsConfigPath),
                    tsConfig.compilerOptions.baseUrl
                );
            }

            if (tsConfig.compilerOptions.paths) {
                for (const [pattern, mappings] of Object.entries(tsConfig.compilerOptions.paths)) {
                    this.pathMappings.set(pattern, mappings);
                }
            }
        }
    }

    resolve(importPath: string): string | null {
        // Try to match against each path pattern.
        for (const [pattern, mappings] of this.pathMappings.entries()) {
            const match = this.matchPattern(importPath, pattern);
            if (match !== null) {
                // Use the first mapping. TypeScript typically tries multiple mappings in order
                // until one resolves to an existing file, but for simplicity we use the first one.
                // This is sufficient for most common use cases.
                const mapping = mappings[0];
                const resolvedPath = this.replacePlaceholder(mapping, match);
                return path.resolve(this.baseUrl, resolvedPath);
            }
        }

        return null;
    }

    private matchPattern(importPath: string, pattern: string): string | null {
        // Handle wildcard patterns like "@/*" or "@extensions/*".
        if (pattern.endsWith("/*")) {
            const prefix = pattern.slice(0, -2);
            // Only match if there's a slash after the prefix.
            if (importPath.startsWith(prefix + "/")) {
                return importPath.slice(prefix.length + 1);
            }
        } else if (pattern === importPath) {
            return "";
        }

        return null;
    }

    private replacePlaceholder(mapping: string, match: string): string {
        // Replace wildcard with the matched part.
        if (mapping.endsWith("/*")) {
            return mapping.slice(0, -2) + "/" + match;
        }
        return mapping;
    }
}
