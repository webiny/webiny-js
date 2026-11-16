import fs from "fs";
import { Project as TsMorphProject } from "ts-morph";
import { ensureNamedImport } from "~/utils/ensureNamedImport.js";
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
        // Skip undefined values.
        if (value === undefined) {
            continue;
        }

        // Determine the serialization based on value type.
        let serializedValue: string;

        if (typeof value === "string") {
            // Strings: use JSON.stringify to handle escaping, then wrap in curly braces.
            serializedValue = `{${JSON.stringify(value)}}`;
        } else if (typeof value === "number" || typeof value === "boolean") {
            // Numbers and booleans: wrap in curly braces without quotes.
            serializedValue = `{${value}}`;
        } else if (value === null) {
            // Null values.
            serializedValue = `{null}`;
        } else if (Array.isArray(value) || typeof value === "object") {
            // Arrays and objects: use JSON.stringify, then wrap in curly braces.
            serializedValue = `{${JSON.stringify(value)}}`;
        } else {
            // Fallback for any other types.
            serializedValue = `{${JSON.stringify(value)}}`;
        }

        attributes.push(`${key}=${serializedValue}`);
    }

    return attributes.join(" ");
};

/**
 * Adds a component to the Extensions function in the webiny.config.tsx content.
 */
const addComponentToExtensions = (
    content: string,
    componentName: string,
    props?: Record<string, any>
): string => {
    // Serialize props to JSX attributes.
    const propsString = props ? serializePropsToJsx(props) : "";

    // Generate component tag with or without props.
    const componentTag = propsString
        ? `<${componentName} ${propsString} />`
        : `<${componentName} />`;

    // Check if component already exists.
    if (content.includes(componentTag)) {
        return content;
    }

    // Find the Extensions function's return statement and add component before the final </>.
    // Strategy: Find "export const Extensions" block, then find the last </> and insert before it.
    const extensionsFuncRegex = /export const Extensions = \(\) => \{[\s\S]*?\};/;
    const extensionsFuncMatch = content.match(extensionsFuncRegex);

    if (!extensionsFuncMatch) {
        return content;
    }

    const funcContent = extensionsFuncMatch[0];
    // Find all </> in the function - the last one closes the return statement.
    const closingTags = [...funcContent.matchAll(/<\/>/g)];

    if (closingTags.length === 0) {
        return content;
    }

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

    return content.replace(extensionsFuncRegex, newFuncContent);
};

/**
 * Update the webiny.config.tsx file to add extension imports and component.
 */
export const updateWebinyConfig = async (params: UpdateWebinyConfigParams): Promise<void> => {
    const { projectRoot, webinyConfigTsx } = params;

    const webinyConfigPath = `${projectRoot}/webiny.config.tsx`;

    // Read the current webiny.config.tsx
    let content = fs.readFileSync(webinyConfigPath, "utf-8");

    // Add imports. Parsed rather than matched with a pattern, so every existing import from a
    // path is seen, whatever its shape.
    if (webinyConfigTsx.imports && webinyConfigTsx.imports.length > 0) {
        const tsMorphProject = new TsMorphProject({ useInMemoryFileSystem: true });
        const sourceFile = tsMorphProject.createSourceFile(webinyConfigPath, content);

        for (const importStatement of webinyConfigTsx.imports) {
            ensureNamedImport(sourceFile, importStatement.specifier, importStatement.path);
        }

        content = sourceFile.getFullText();
    }

    // Add component to the Extensions function.
    if (webinyConfigTsx.component) {
        content = addComponentToExtensions(
            content,
            webinyConfigTsx.component.name,
            webinyConfigTsx.component.props
        );
    }

    // Add multiple components to the Extensions function.
    if (webinyConfigTsx.components && webinyConfigTsx.components.length > 0) {
        for (const component of webinyConfigTsx.components) {
            content = addComponentToExtensions(content, component.name, component.props);
        }
    }

    // Write the updated content back
    fs.writeFileSync(webinyConfigPath, content, "utf-8");
};
