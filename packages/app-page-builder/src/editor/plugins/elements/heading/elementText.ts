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
                styles: [],
                format: "",
                indent: 0,
                type: "heading-element",
                version: 1,
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

export const defaultText = lexicalText;
export const displayText = "Heading";
