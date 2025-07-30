import postcss, { type AtRule } from "postcss";
import path from "path";
import { readFile } from "fs";
import { promisify } from "util";

const readFileAsync = promisify(readFile);

export class CSSInliner {
    private seen = new Set<string>();

    async load(entryPath: string): Promise<string> {
        const result = await this.inlineFile(entryPath);
        return result.css;
    }

    private async inlineFile(filePath: string): Promise<postcss.Result> {
        const absolutePath = path.resolve(filePath);

        if (this.seen.has(absolutePath)) {
            return postcss().process("", { from: undefined });
        }

        this.seen.add(absolutePath);
        const css = await readFileAsync(absolutePath, "utf8");

        return postcss([this.createImportInlinerPlugin(path.dirname(absolutePath))]).process(css, {
            from: absolutePath
        });
    }

    private createImportInlinerPlugin(currentDir: string) {
        return {
            postcssPlugin: "css-inliner",
            AtRule: async (atRule: AtRule) => {
                if (atRule.name !== "import") {
                    return;
                }

                const importPath = atRule.params.replace(/^url\(|\)$|['"]/g, "").trim();

                let importedCSS: string;
                let from: string | undefined;

                try {
                    if (importPath.startsWith("http://") || importPath.startsWith("https://")) {
                        // Leave remote @import untouched
                        return;
                    } else {
                        const resolvedPath = path.resolve(currentDir, importPath);

                        if (this.seen.has(resolvedPath)) {
                            atRule.remove();
                            return;
                        }

                        this.seen.add(resolvedPath);
                        importedCSS = await readFileAsync(resolvedPath, "utf8");
                        from = resolvedPath;
                    }
                } catch (err) {
                    console.warn(`⚠️ Failed to inline import: ${importPath}`, err);
                    return;
                }

                const result = await postcss([
                    this.createImportInlinerPlugin(from ? path.dirname(from) : currentDir)
                ]).process(importedCSS, { from });

                const root = postcss.parse(result.css);

                if (atRule.parent?.type === "atrule" && atRule.parent.name === "media") {
                    atRule.replaceWith(root);
                } else {
                    atRule.replaceWith(root.nodes);
                }
            }
        };
    }
}

// @ts-expect-error `postcss` requires this to treat the function as a valid plugin.
CSSInliner.prototype.createImportInlinerPlugin.postcss = true;
