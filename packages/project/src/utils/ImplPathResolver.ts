import path from "path";
import fs from "fs";
import stripJsonComments from "strip-json-comments";
import { type IProjectModel } from "~/abstractions/models/index.js";

interface TsConfig {
    compilerOptions?: {
        baseUrl?: string;
        paths?: {
            [key: string]: string[];
        };
    };
}

export class ImplPathResolver {
    private static pathMappings: { [key: string]: string[] } | null = null;

    /**
     * Import a module from a given file path.
     * - If path starts with "/extensions/", it resolves from project root
     * - If path matches tsconfig path alias (e.g., "@/*"), it resolves using tsconfig
     * - Otherwise, treats path as absolute
     * Returns the default export or named export matching the filename.
     */
    static async importFromPath(filePath: string, project: IProjectModel) {
        const importPath = this.resolvePath(filePath, project);
        const exportName = path.basename(filePath).replace(path.extname(filePath), "");

        const importedModule = await import(importPath);

        // Support both default and named exports.
        // Check for 'default' property existence rather than truthiness.
        return (
            ("default" in importedModule && importedModule.default) || importedModule[exportName]
        );
    }

    /**
     * Resolve a file path to an absolute path.
     * - If path starts with "/extensions/", it resolves from project root
     * - If path matches tsconfig path alias (e.g., "@/*"), it resolves using tsconfig
     * - Otherwise, treats path as absolute
     * Returns the absolute path without importing.
     */
    static resolvePath(filePath: string, project: IProjectModel): string {
        if (filePath.startsWith("/extensions/")) {
            // Resolve from project root.
            return project.paths.rootFolder.join(filePath).toString();
        } else {
            // Try to resolve using tsconfig path aliases.
            const resolved = this.resolvePathAlias(filePath, project);
            if (resolved) {
                return resolved;
            } else {
                // Treat as absolute path.
                return filePath;
            }
        }
    }

    /**
     * Check if a file exists at the given path.
     * Resolves the path using the same logic as resolvePath before checking.
     * - If path starts with "/extensions/", it resolves from project root
     * - If path matches tsconfig path alias (e.g., "@/*"), it resolves using tsconfig
     * - Otherwise, treats path as absolute
     * Returns true if the file exists, false otherwise.
     */
    static existsSync(filePath: string, project: IProjectModel): boolean {
        const absolutePath = this.resolvePath(filePath, project);
        return fs.existsSync(absolutePath);
    }

    private static resolvePathAlias(filePath: string, project: IProjectModel): string | null {
        const projectRoot = project.paths.rootFolder.toString();

        // Load path mappings from tsconfig if not already cached.
        if (this.pathMappings === null) {
            this.loadPathMappings(project);
        }

        if (!this.pathMappings) {
            return null;
        }

        // Try to match against each path pattern.
        for (const [pattern, targets] of Object.entries(this.pathMappings)) {
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

    private static loadPathMappings(project: IProjectModel): void {
        const tsConfigPath = project.paths.tsConfigFile.toString();

        if (!fs.existsSync(tsConfigPath)) {
            this.pathMappings = {};
            return;
        }

        try {
            const tsConfigContent = fs.readFileSync(tsConfigPath, "utf-8");
            const tsConfigWithoutComments = stripJsonComments(tsConfigContent);
            const tsConfig = JSON.parse(tsConfigWithoutComments) as TsConfig;

            if (tsConfig.compilerOptions?.paths) {
                this.pathMappings = tsConfig.compilerOptions.paths;
            } else {
                this.pathMappings = {};
            }
        } catch (error) {
            // Ignore tsconfig parsing errors.
            this.pathMappings = {};
        }
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
