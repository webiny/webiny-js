import fs from "fs";
import { ExtensionWebinyConfigTsx } from "./types.js";

interface UpdateWebinyConfigParams {
    projectRoot: string;
    webinyConfigTsx: ExtensionWebinyConfigTsx;
}

/**
 * Serializes a props object to JSX attribute syntax.
 * Examples:
 * - { secretKey: "value" } => 'secretKey={"value"}'
 * - { enabled: true } => 'enabled={true}'
 * - { count: 42 } => 'count={42}'
 * - { config: { key: "value" } } => 'config={{"key":"value"}}'
 */
const serializePropsToJsx = (props: Record<string, any>): string => {
    const attributes: string[] = [];

    for (const [key, value] of Object.entries(props)) {
        // Skip undefined values
        if (value === undefined) {
            continue;
        }

        // Determine the serialization based on value type
        let serializedValue: string;

        if (typeof value === "string") {
            // Strings: use JSON.stringify to handle escaping, then wrap in curly braces
            serializedValue = `{${JSON.stringify(value)}}`;
        } else if (typeof value === "number" || typeof value === "boolean") {
            // Numbers and booleans: wrap in curly braces without quotes
            serializedValue = `{${value}}`;
        } else if (value === null) {
            // Null values
            serializedValue = `{null}`;
        } else if (Array.isArray(value) || typeof value === "object") {
            // Arrays and objects: use JSON.stringify, then wrap in curly braces
            serializedValue = `{${JSON.stringify(value)}}`;
        } else {
            // Fallback for any other types
            serializedValue = `{${JSON.stringify(value)}}`;
        }

        attributes.push(`${key}=${serializedValue}`);
    }

    return attributes.join(" ");
};

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
            // Check if we need to add to an existing import from the same path.
            const existingImportRegex = new RegExp(
                `import\\s+{([^}]+)}\\s+from\\s+["']${importStatement.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'];?`,
                "m"
            );
            const existingImportMatch = content.match(existingImportRegex);

            if (existingImportMatch) {
                // Import from this path exists, check if specifier is already imported.
                const existingSpecifiers = existingImportMatch[1].split(",").map(s => s.trim());

                if (!existingSpecifiers.includes(importStatement.specifier)) {
                    // Append the new specifier to the existing import.
                    const updatedSpecifiers = [
                        ...existingSpecifiers,
                        importStatement.specifier
                    ].join(", ");
                    const updatedImportLine = `import { ${updatedSpecifiers} } from "${importStatement.path}";`;
                    content = content.replace(existingImportRegex, updatedImportLine);
                }
            } else {
                // No existing import from this path, add a new import line.
                const importLine = `import { ${importStatement.specifier} } from "${importStatement.path}";`;

                // Find the position after the last import or at the beginning.
                const importRegex = /^import\s+.*?from\s+["'].*?["'];?\s*$/gm;
                const matches = Array.from(content.matchAll(importRegex));

                if (matches.length > 0) {
                    // Add after the last import.
                    const lastImport = matches[matches.length - 1];
                    const lastImportEnd = lastImport.index! + lastImport[0].length;
                    content =
                        content.slice(0, lastImportEnd) +
                        "\n" +
                        importLine +
                        content.slice(lastImportEnd);
                } else {
                    // No imports found, add at the beginning.
                    content = importLine + "\n\n" + content;
                }
            }
        }
    }

    // Helper function to add a component to the Extensions function.
    const addComponentToExtensions = (componentName: string, props?: Record<string, any>) => {
        // Serialize props to JSX attributes.
        const propsString = props ? serializePropsToJsx(props) : "";

        // Generate component tag with or without props.
        const componentTag = propsString
            ? `<${componentName} ${propsString} />`
            : `<${componentName} />`;

        // Check if component already exists.
        if (!content.includes(componentTag)) {
            // Find the Extensions function's return statement and add component before the final </>.
            // Strategy: Find "export const Extensions" block, then find the last </> and insert before it.
            const extensionsFuncRegex = /export const Extensions = \(\) => \{[\s\S]*?\};/;
            const extensionsFuncMatch = content.match(extensionsFuncRegex);

            if (extensionsFuncMatch) {
                const funcContent = extensionsFuncMatch[0];
                // Find all </> in the function - the last one closes the return statement.
                const closingTags = [...funcContent.matchAll(/<\/>/g)];

                if (closingTags.length > 0) {
                    const lastClosingTag = closingTags[closingTags.length - 1];
                    const lastClosingTagIndex = lastClosingTag.index!;

                    // Find the indentation of the line containing the last </>.
                    const beforeClosing = funcContent.substring(0, lastClosingTagIndex);
                    const lines = beforeClosing.split("\n");
                    const lastLine = lines[lines.length - 1];
                    const indent = lastLine.match(/^(\s*)/)?.[1] || "        ";

                    // Insert the component before the last </>.
                    const newFuncContent =
                        funcContent.substring(0, lastClosingTagIndex) +
                        `${indent}${componentTag}\n${indent}` +
                        funcContent.substring(lastClosingTagIndex);

                    content = content.replace(extensionsFuncRegex, newFuncContent);
                }
            }
        }
    };

    // Add component to the Extensions function.
    if (webinyConfigTsx.component) {
        addComponentToExtensions(webinyConfigTsx.component.name, webinyConfigTsx.component.props);
    }

    // Add multiple components to the Extensions function.
    if (webinyConfigTsx.components && webinyConfigTsx.components.length > 0) {
        for (const component of webinyConfigTsx.components) {
            addComponentToExtensions(component.name, component.props);
        }
    }

    // Write the updated content back
    fs.writeFileSync(webinyConfigPath, content, "utf-8");
};
