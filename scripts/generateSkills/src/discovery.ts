/**
 * Discovery module — scans webiny package.json exports and barrel files
 * to find all exported abstractions.
 */
import fs from "fs";
import path from "path";
import type { Project } from "ts-morph";
import type { DiscoveredExport } from "./types.js";

/**
 * Discover all named exports from webiny barrel files under ./api/**.
 */
export function discover(project: Project, repoRoot: string): DiscoveredExport[] {
    const pkgJsonPath = path.join(repoRoot, "packages/webiny/package.json");
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const exportPaths = Object.keys(pkgJson.exports || {});

    // Scan all non-root export paths (skip "." itself)
    const apiPaths = exportPaths.filter(p => p !== "." && p.startsWith("./"));

    const results: DiscoveredExport[] = [];

    for (const exportPath of apiPaths) {
        const srcRelative = exportPath.replace(/^\.\//, "");
        const srcPath = path.join(repoRoot, "packages/webiny/src", srcRelative + ".ts");

        let sourceFile = project.getSourceFile(srcPath);
        if (!sourceFile) {
            try {
                sourceFile = project.addSourceFileAtPath(srcPath);
            } catch {
                continue;
            }
        }
        if (!sourceFile) {
            continue;
        }

        const importPath = "webiny/" + srcRelative;

        for (const exportDecl of sourceFile.getExportDeclarations()) {
            const declIsType = exportDecl.isTypeOnly();
            for (const ne of exportDecl.getNamedExports()) {
                const name = ne.getName();
                // A named export is type-only if the whole declaration is `export type { ... }`
                // or the individual specifier uses `export { type Foo }`.
                const isType = declIsType || ne.isTypeOnly();

                results.push({
                    className: name,
                    importPath,
                    isType
                });
            }
        }
    }

    return results;
}
