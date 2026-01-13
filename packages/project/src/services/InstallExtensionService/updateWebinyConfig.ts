import fs from "fs";
import { ExtensionWebinyConfigTsx } from "./types.js";

interface UpdateWebinyConfigParams {
    projectRoot: string;
    webinyConfigTsx: ExtensionWebinyConfigTsx;
}

/**
 * Update the webiny.config.tsx file to add extension imports and component.
 */
export const updateWebinyConfig = async (params: UpdateWebinyConfigParams): Promise<void> => {
    const { projectRoot, webinyConfigTsx } = params;

    const webinyConfigPath = `${projectRoot}/webiny.config.tsx`;

    // Read the current webiny.config.tsx
    let content = fs.readFileSync(webinyConfigPath, "utf-8");

    // Add imports at the top (after existing imports)
    if (webinyConfigTsx.imports && webinyConfigTsx.imports.length > 0) {
        for (const importStatement of webinyConfigTsx.imports) {
            const importLine = `import { ${importStatement.specifier} } from "${importStatement.path}";`;

            // Check if import already exists
            if (!content.includes(importLine)) {
                // Find the position after the last import or at the beginning
                const importRegex = /^import\s+.*?from\s+["'].*?["'];?\s*$/gm;
                const matches = Array.from(content.matchAll(importRegex));

                if (matches.length > 0) {
                    // Add after the last import
                    const lastImport = matches[matches.length - 1];
                    const lastImportEnd = lastImport.index! + lastImport[0].length;
                    content =
                        content.slice(0, lastImportEnd) +
                        "\n" +
                        importLine +
                        content.slice(lastImportEnd);
                } else {
                    // No imports found, add at the beginning
                    content = importLine + "\n\n" + content;
                }
            }
        }
    }

    // Add component to the Extensions function
    if (webinyConfigTsx.component) {
        const componentName = webinyConfigTsx.component.name;
        const componentTag = `<${componentName} />`;

        // Check if component already exists
        if (!content.includes(componentTag)) {
            // Find the Extensions function's return statement and add component before the final </>
            // Strategy: Find "export const Extensions" block, then find the last </> and insert before it
            const extensionsFuncRegex = /export const Extensions = \(\) => \{[\s\S]*?\};/;
            const extensionsFuncMatch = content.match(extensionsFuncRegex);

            if (extensionsFuncMatch) {
                const funcContent = extensionsFuncMatch[0];
                // Find all </> in the function - the last one closes the return statement
                const closingTags = [...funcContent.matchAll(/<\/>/g)];

                if (closingTags.length > 0) {
                    const lastClosingTag = closingTags[closingTags.length - 1];
                    const lastClosingTagIndex = lastClosingTag.index!;

                    // Find the indentation of the line containing the last </>
                    const beforeClosing = funcContent.substring(0, lastClosingTagIndex);
                    const lines = beforeClosing.split("\n");
                    const lastLine = lines[lines.length - 1];
                    const indent = lastLine.match(/^(\s*)/)?.[1] || "        ";

                    // Insert the component before the last </>
                    const newFuncContent =
                        funcContent.substring(0, lastClosingTagIndex) +
                        `${indent}${componentTag}\n${indent}` +
                        funcContent.substring(lastClosingTagIndex);

                    content = content.replace(extensionsFuncRegex, newFuncContent);
                }
            }
        }
    }

    // Write the updated content back
    fs.writeFileSync(webinyConfigPath, content, "utf-8");
};
