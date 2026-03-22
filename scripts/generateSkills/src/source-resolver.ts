/**
 * Source resolver — minimal ts-morph utilities for resolving source file paths.
 * LLMs read the resolved source files on demand for type information.
 */
import { Project, type SourceFile } from "ts-morph";
import path from "path";

/**
 * Create a ts-morph Project configured with the webiny tsconfig.
 */
export function createProject(repoRoot: string): Project {
    const tsConfigPath = path.join(repoRoot, "packages/webiny/tsconfig.json");
    return new Project({
        tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: false
    });
}

/**
 * Follow a re-export chain from a barrel file to the actual source file.
 */
export function followReExport(
    project: Project,
    barrelFilePath: string,
    exportName: string
): SourceFile | undefined {
    const barrelFile = project.getSourceFile(barrelFilePath);
    if (!barrelFile) return undefined;

    for (const exportDecl of barrelFile.getExportDeclarations()) {
        const namedExports = exportDecl.getNamedExports();
        const match = namedExports.find(
            ne => ne.getName() === exportName || ne.getAliasNode()?.getText() === exportName
        );
        if (match) {
            return exportDecl.getModuleSpecifierSourceFile() || undefined;
        }
    }
    return undefined;
}

/**
 * Get a node_modules-resolvable path for a source file.
 * Converts "packages/api-aco/src/features/..." → "@webiny/api-aco/features/..."
 */
export function getPackagePath(sourceFile: SourceFile, repoRoot: string): string {
    const filePath = sourceFile.getFilePath();
    const relPath = path.relative(repoRoot, filePath);

    // Match: packages/<pkg-name>/src/<rest>
    const match = relPath.match(/^packages\/([^/]+)\/src\/(.+)$/);
    if (match) {
        return `@webiny/${match[1]}/${match[2]}`;
    }

    // Fallback to relative path if pattern doesn't match
    return relPath;
}

/**
 * Extract JSDoc description from a declaration, following re-exports if needed.
 */
export function getJsDoc(sourceFile: SourceFile, exportName: string): string {
    // Try to find JSDoc directly in this file
    const doc = extractJsDoc(sourceFile, exportName);
    if (doc) return doc;

    // If not found, the file may re-export from another file — follow it
    for (const exportDecl of sourceFile.getExportDeclarations()) {
        const targetFile = exportDecl.getModuleSpecifierSourceFile();
        if (!targetFile) continue;

        // Named re-export: `export { Foo } from "./bar.js"`
        const match = exportDecl
            .getNamedExports()
            .find(ne => ne.getName() === exportName || ne.getAliasNode()?.getText() === exportName);
        if (match) {
            const doc = getJsDoc(targetFile, exportName);
            if (doc) return doc;
        }

        // Star re-export: `export * from "./bar.js"`
        if (exportDecl.isNamespaceExport() || exportDecl.getNamedExports().length === 0) {
            const doc = getJsDoc(targetFile, exportName);
            if (doc) return doc;
        }
    }

    return "";
}

function extractJsDoc(sourceFile: SourceFile, name: string): string {
    const varDecl = sourceFile.getVariableDeclaration(name);
    if (varDecl) {
        const jsDocs = varDecl.getVariableStatement()?.getJsDocs();
        if (jsDocs && jsDocs.length > 0) {
            return jsDocs[0].getDescription().trim();
        }
    }

    const classDecl = sourceFile.getClass(name);
    if (classDecl) {
        const jsDocs = classDecl.getJsDocs();
        if (jsDocs.length > 0) {
            return jsDocs[0].getDescription().trim();
        }
    }

    const funcDecl = sourceFile.getFunction(name);
    if (funcDecl) {
        const jsDocs = funcDecl.getJsDocs();
        if (jsDocs.length > 0) {
            return jsDocs[0].getDescription().trim();
        }
    }

    return "";
}
