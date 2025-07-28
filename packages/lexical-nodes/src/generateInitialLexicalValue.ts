const defaultLexicalValue = JSON.stringify({
    root: {
        children: [
            {
                children: [],
                direction: null,
                format: "",
                indent: 0,
                styles: [],
                type: "wby-paragraph",
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
export const generateInitialLexicalValue = (): string => {
    return defaultLexicalValue;
};
