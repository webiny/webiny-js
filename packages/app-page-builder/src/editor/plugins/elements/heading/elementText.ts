import { isLegacyRenderingEngine } from "~/utils";

const legacyText = `Heading`;

const lexicalText = JSON.stringify({
    root: {
        children: [
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Heading", // text that will be rendered inside h1 HTML tag
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                // This prop describes the 'type' of the lexical node.
                // In this case Lexical will create an instance from Heading node class
                // that manage the creation of the h1-h6 HTML tags and the content inside.
                type: "heading",
                version: 1,
                // Lexical Heading node will create <h1> HTML tag.
                tag: "h1"
            }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
});

export const defaultText = isLegacyRenderingEngine ? legacyText : lexicalText;
export const displayText = legacyText;
