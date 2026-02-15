import path from "path";
import { type IProjectModel } from "~/abstractions/models/index.js";
import { TsConfigPathResolver } from "./TsConfigPathResolver.js";

export class ImplPathResolver {
    private static tsConfigResolver: TsConfigPathResolver | null = null;

    /**
     * Import a module from a given file path.
     * - If path starts with "/extensions/", it resolves from project root
     * - If path matches tsconfig path alias (e.g., "@/*"), it resolves using tsconfig
     * - Otherwise, treats path as absolute
     * Returns the default export or named export matching the filename.
     */
    static async importFromPath(filePath: string, project: IProjectModel) {
        let importPath: string;

        // Initialize tsconfig resolver if not already done.
        if (!this.tsConfigResolver) {
            const tsConfigPath = project.paths.tsConfigFile.toString();
            const projectRoot = project.paths.rootFolder.toString();
            this.tsConfigResolver = new TsConfigPathResolver(tsConfigPath, projectRoot);
        }

        if (filePath.startsWith("/extensions/")) {
            // Resolve from project root.
            importPath = project.paths.rootFolder.join(filePath).toString();
        } else {
            // Try to resolve using tsconfig path aliases.
            const resolved = this.tsConfigResolver.resolve(filePath);
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
}
