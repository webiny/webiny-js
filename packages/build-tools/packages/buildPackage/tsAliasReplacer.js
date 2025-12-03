import { dirname, relative } from "path";
import fg from "fast-glob";
import fs from "fs";

export const replaceTscAliases = async ({ distDir, cwd, debug = false }) => {
    const dtsFiles = await fg("**/*.d.ts", {
        cwd: distDir,
        absolute: true
    });

    for (const dtsFile of dtsFiles) {
        let content = fs.readFileSync(dtsFile, "utf8");
        let modified = false;

        // Replace all imports/exports with ~/ alias
        content = content.replace(
            /(from\s+["'])~\/([^"']+)(["'])/g,
            (match, prefix, importPath, suffix) => {
                modified = true;
                // Calculate relative path from current file to dist root
                const fileDir = dirname(dtsFile);
                const relativePath = relative(fileDir, distDir);
                const finalPath = relativePath
                    ? `${relativePath}/${importPath}`
                    : `./${importPath}`;
                // Normalize to always start with ./
                const normalized = finalPath.startsWith(".") ? finalPath : `./${finalPath}`;
                return `${prefix}${normalized}${suffix}`;
            }
        );

        if (modified) {
            fs.writeFileSync(dtsFile, content, "utf8");
            if (debug) {
                console.log(`Resolved ~ aliases in: ${relative(cwd, dtsFile)}`);
            }
        }
    }
};
