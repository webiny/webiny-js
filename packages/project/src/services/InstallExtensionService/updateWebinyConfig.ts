import fs from "fs";
import { ExtensionWebinyConfigTsx } from "./types.js";

interface UpdateWebinyConfigParams {
    projectRoot: string;
    webinyConfigTsx?: ExtensionWebinyConfigTsx;
}

/**
 * Update the webiny.config.tsx file to add extension imports and component.
 */
export const updateWebinyConfig = async (params: UpdateWebinyConfigParams): Promise<void> => {
    const { projectRoot, webinyConfigTsx } = params;

    if (!webinyConfigTsx) {
        return;
    }

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
            // Find the Extensions function and add the component
            // Look for: return <>{/* ... */}</>;
            const returnPattern = /return\s+<>(\s*\{\/\*[^*]*\*\/\}\s*)<\/>/;
            const match = content.match(returnPattern);

            if (match) {
                // Replace with the component added
                const replacement = `return <>${match[1]}${componentTag}</>`;
                content = content.replace(returnPattern, replacement);
            } else {
                // Try alternative pattern: return <>...</>
                const altPattern = /return\s+<>(.*?)<\/>/s;
                const altMatch = content.match(altPattern);

                if (altMatch) {
                    const existingContent = altMatch[1].trim();
                    const replacement = `return <>\n        ${existingContent ? existingContent + "\n        " : ""}${componentTag}\n    </>`;
                    content = content.replace(altPattern, replacement);
                }
            }
        }
    }

    // Write the updated content back
    fs.writeFileSync(webinyConfigPath, content, "utf-8");
};
