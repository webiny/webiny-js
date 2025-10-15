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
                // Extract the file extension from the import path
                const lastDotIndex = spec.lastIndexOf(".");
                const lastSlashIndex = Math.max(spec.lastIndexOf("/"), spec.lastIndexOf("\\"));
                const hasExtension = lastDotIndex > lastSlashIndex;

                // If there's no extension, it should have .js
                if (!hasExtension) {
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
