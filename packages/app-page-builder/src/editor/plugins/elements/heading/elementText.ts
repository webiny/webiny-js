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
                        text: "Heading",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1
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
