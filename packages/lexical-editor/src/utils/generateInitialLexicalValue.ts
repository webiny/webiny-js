import { LexicalValue } from "~/types";

/**
 * @description Basic JSON data string that will initialize the editor.
 */
export const generateInitialLexicalValue = (): LexicalValue => {
    return JSON.stringify({
        root: {
            children: [
                {
                    children: [],
                    direction: null,
                    format: "",
                    indent: 0,
                    styles: [],
                    type: "base-paragraph-node",
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
};
