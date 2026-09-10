import frontmatter from "front-matter";

export interface ParsedGeneratedSource {
    source: string;
    css: string;
    name: string;
    label: string;
    description: string;
    aiContext: string;
}

interface FrontmatterAttributes {
    name?: string;
    label?: string;
    description?: string;
    aiContext?: string;
}

export function parseGeneratedSource(text: string): ParsedGeneratedSource {
    const fm = frontmatter<FrontmatterAttributes>(text);

    const body = fm.body;

    const jsxMatch = body.match(/```(?:jsx|javascript|js)\s*\n([\s\S]*?)```/);
    if (!jsxMatch) {
        throw new Error(
            "Could not find a JSX code block in the AI response. Expected ```jsx ... ``` fencing."
        );
    }

    const source = jsxMatch[1].trim();

    const cssMatch = body.match(/```css\s*\n([\s\S]*?)```/);
    const css = cssMatch ? cssMatch[1].trim() : "";

    const name =
        fm.attributes.name || extractFromSource(source, "name") || "Custom/GeneratedComponent";
    const label = fm.attributes.label || extractFromSource(source, "label") || name;
    const description = fm.attributes.description || label;
    const aiContext = fm.attributes.aiContext || "";

    return { source, css, name, label, description, aiContext };
}

function extractFromSource(source: string, field: string): string | null {
    const match = source.match(new RegExp(`${field}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`));
    return match ? match[1] : null;
}
