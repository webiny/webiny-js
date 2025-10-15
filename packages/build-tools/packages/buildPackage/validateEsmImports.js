import fs from "fs";
import { join } from "path";
import glob from "fast-glob";

export const validateEsmImports = async ({ cwd, logs = true }) => {
    logs !== false && console.log("Validating ESM imports...");

    const pattern = join(cwd, "src/**/*.{js,ts,tsx}").replace(/\\/g, "/");
    const files = glob.sync(pattern, {
        absolute: true,
        onlyFiles: true
    });

    const errors = [];

    for (const file of files) {
        const content = await fs.promises.readFile(file, "utf8");

        // Capture import ... from 'foo' and bare import 'foo'
        const regex = /\bimport(?:["'\s]*[\w*{}\n, ]+from\s*)?["']([^"']+)["']/g;

        let match;
        while ((match = regex.exec(content))) {
            const spec = match[1];
            if (spec.startsWith("~") || spec.startsWith("./") || spec.startsWith("../")) {
                // Asset files (images, styles, etc.) don't need .js extension
                const assetExtensions = [
                    ".svg",
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".gif",
                    ".webp",
                    ".ico",
                    ".css",
                    ".scss",
                    ".sass",
                    ".less"
                ];
                const hasAssetExtension = assetExtensions.some(ext => spec.endsWith(ext));

                // Check if the import has a .js/.json extension or is an asset file
                if (!spec.endsWith(".js") && !spec.endsWith(".json") && !hasAssetExtension) {
                    const errorMsg = `❌ Missing .js extension in import "${spec}" in ${file}`;
                    console.error(errorMsg);
                    errors.push({ file, spec, reason: "missing extension" });
                    continue;
                }

                // Verify the file actually exists
                try {
                    await import.meta.resolve(spec, `file://${file}`);
                } catch {
                    const errorMsg = `❌ Cannot resolve import "${spec}" in ${file}`;
                    console.error(errorMsg);
                    errors.push({ file, spec, reason: "cannot resolve" });
                }
            }
        }
    }

    if (errors.length > 0) {
        const invalidFiles = [...new Set(errors.map(e => e.file))];
        const errorMessage = [
            "ESM import validation failed.",
            `Found ${errors.length} invalid import(s) in ${invalidFiles.length} file(s):`,
            ...invalidFiles.map(f => `  - ${f}`)
        ].join("\n");
        throw new Error(errorMessage);
    } else {
        logs !== false && console.log("✅ All ESM imports are valid.");
    }
};
