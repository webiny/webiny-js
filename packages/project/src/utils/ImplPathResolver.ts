import path from "path";
import readJsonSync from "read-json-sync";
import fs from "fs";
import { type IProjectModel } from "~/abstractions/models/index.js";

interface TsConfigPaths {
    [key: string]: string[];
}

interface TsConfig {
    compilerOptions?: {
        baseUrl?: string;
        paths?: TsConfigPaths;
    };
}

export class ImplPathResolver {
    private static pathMappings: Map<string, Map<string, string[]>> = new Map();

    /**
     * Import a module from a given file path.
     * - If path starts with "/extensions/", it resolves from project root
     * - If path matches tsconfig path alias (e.g., "@/*"), it resolves using tsconfig
     * - Otherwise, treats path as absolute
     * Returns the default export or named export matching the filename.
     */
    static async importFromPath(filePath: string, project: IProjectModel) {
        let importPath: string;

        if (filePath.startsWith("/extensions/")) {
            // Resolve from project root.
            importPath = project.paths.rootFolder.join(filePath).toString();
        } else {
            // Try to resolve using tsconfig path aliases.
            const resolved = this.resolvePathAlias(filePath, project);
            if (resolved) {
                importPath = resolved;
            } else {
                // Treat as absolute path.
                importPath = filePath;
            }
        }

        const exportName = path.basename(filePath).replace(path.extname(filePath), "");

        const importedModule = await import(importPath);

        // Support both default and named exports.
        // Check for 'default' property existence rather than truthiness.
        return (
            ("default" in importedModule && importedModule.default) || importedModule[exportName]
        );
    }

    private static resolvePathAlias(filePath: string, project: IProjectModel): string | null {
        const tsConfigPath = project.paths.tsConfigFile.toString();
        const projectRoot = project.paths.rootFolder.toString();

        // Load path mappings from tsconfig if not already cached.
        if (!this.pathMappings.has(tsConfigPath)) {
            this.loadPathMappings(tsConfigPath, projectRoot);
        }

        const mappings = this.pathMappings.get(tsConfigPath);
        if (!mappings) {
            return null;
        }

        // Try to match against each path pattern.
        for (const [pattern, targets] of mappings.entries()) {
            const match = this.matchPattern(filePath, pattern);
            if (match !== null) {
                // Use the first mapping.
                const target = targets[0];
                const resolvedPath = this.replacePlaceholder(target, match);
                return path.resolve(projectRoot, resolvedPath);
            }
        }

        return null;
    }

    private static loadPathMappings(tsConfigPath: string, projectRoot: string): void {
        const mappings = new Map<string, string[]>();

        if (!fs.existsSync(tsConfigPath)) {
            this.pathMappings.set(tsConfigPath, mappings);
            return;
        }

        try {
            const tsConfig = readJsonSync(tsConfigPath) as TsConfig;

            if (tsConfig.compilerOptions?.paths) {
                for (const [pattern, targets] of Object.entries(tsConfig.compilerOptions.paths)) {
                    mappings.set(pattern, targets);
                }
            }
        } catch (error) {
            // Ignore tsconfig parsing errors.
        }

        this.pathMappings.set(tsConfigPath, mappings);
    }

    private static matchPattern(importPath: string, pattern: string): string | null {
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

    private static replacePlaceholder(mapping: string, match: string): string {
        // Replace wildcard with the matched part.
        if (mapping.endsWith("/*")) {
            return mapping.slice(0, -2) + "/" + match;
        }
        return mapping;
    }
}
