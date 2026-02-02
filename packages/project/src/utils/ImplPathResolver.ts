import path from "path";
import { type IProjectModel } from "~/abstractions/models/index.js";

export class ImplPathResolver {
    /**
     * Import a module from a given file path.
     * - If path starts with "/extensions/", it resolves from project root
     * - Otherwise, treats path as absolute
     * Returns the default export or named export matching the filename.
     */
    static async importFromPath(filePath: string, project: IProjectModel) {
        let importPath: string;
        if (filePath.startsWith("/extensions/")) {
            // Resolve from project root.
            importPath = project.paths.rootFolder.join(filePath).toString();
        } else {
            // Treat as absolute path.
            importPath = filePath;
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
