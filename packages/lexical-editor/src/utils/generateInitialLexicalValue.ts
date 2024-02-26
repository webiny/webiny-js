import { LexicalValue } from "~/types";

const defaultLexicalValue = JSON.stringify({
    root: {
        children: [
            {
                children: [],
                direction: null,
                format: "",
                indent: 0,
                styles: [],
                type: "paragraph-element",
                version: 1
            }
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
});

/**
 * @description Basic JSON data string that will initialize the editor.
 */
export const generateInitialLexicalValue = (): LexicalValue => {
    return defaultLexicalValue;
};
