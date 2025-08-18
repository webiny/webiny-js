import type { SerializedEditorState } from "lexical";
import { generateInitialLexicalValue } from "./generateInitialLexicalValue";

/**
 * Remap various node types to their latest form.
 */
const nodeTypeMap: Record<string, string> = {
    "webiny-list": "wby-list",
    list: "wby-list",
    "webiny-listitem": "wby-list-item",
    "list-item": "wby-list-item",
    "font-color-node": "wby-font-color",
    "font-color": "wby-font-color",
    "heading-element": "wby-heading",
    heading: "wby-heading",
    "paragraph-element": "wby-paragraph",
    paragraph: "wby-paragraph",
    "webiny-quote": "wby-quote",
    quote: "wby-quote",
    image: "wby-image",
    link: "wby-link"
};

// Migrate old node types
function deepReplaceType(node: any): void {
    if (nodeTypeMap.hasOwnProperty(node.type)) {
        node.type = nodeTypeMap[node.type];
    }

    if (node.children) {
        node.children.forEach(deepReplaceType);
    }
}

export const prepareLexicalState = (
    value: string | SerializedEditorState | null | undefined
): string => {
    if (!value) {
        return generateInitialLexicalValue();
    }

    if (typeof value === "string") {
        try {
            const stateAsObject = JSON.parse(value) as SerializedEditorState;
            deepReplaceType(stateAsObject.root);
            return JSON.stringify(stateAsObject);
        } catch {
            return generateInitialLexicalValue();
        }
    }

    try {
        deepReplaceType(value.root);
        return JSON.stringify(value);
    } catch {
        return generateInitialLexicalValue();
    }
};
