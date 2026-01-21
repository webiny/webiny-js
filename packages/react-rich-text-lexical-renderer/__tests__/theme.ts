import { createTheme } from "@webiny/lexical-theme";

export const theme = createTheme({
    colors: [
        {
            id: "color1",
            label: "Primary",
            value: "#fa5723"
        },
        {
            id: "color2",
            label: "Secondary",
            value: "#00ccb0"
        },
        {
            id: "color3",
            label: "Text primary",
            value: "#0a0a0a"
        },
        {
            id: "color4",
            label: "Text secondary",
            value: "#616161"
        },
        {
            id: "color5",
            label: "Background",
            value: "#eaecec"
        },
        {
            id: "color6",
            label: "White background",
            value: "#ffffff"
        }
    ],
    typography: {
        headings: [
            {
                id: "heading1",
                label: "Heading 1",
                tag: "h1",
                className: "wby-heading-1"
            },
            {
                id: "heading2",
                label: "Heading 2",
                tag: "h2",
                className: "wby-heading-2"
            },
            {
                id: "heading3",
                label: "Heading 3",
                tag: "h3",
                className: "wby-heading-3"
            },
            {
                id: "heading4",
                label: "Heading 4",
                tag: "h4",
                className: "wby-heading-4"
            },
            {
                id: "heading5",
                label: "Heading 5",
                tag: "h5",
                className: "wby-heading-5"
            },
            {
                id: "heading6",
                label: "Heading 6",
                tag: "h6",
                className: "wby-heading-6"
            }
        ],
        paragraphs: [
            {
                id: "paragraph1",
                label: "Paragraph 1",
                tag: "p",
                className: "wby-paragraph-1"
            },
            {
                id: "paragraph2",
                label: "Paragraph 2",
                tag: "p",
                className: "wby-paragraph-2"
            }
        ],
        quotes: [
            {
                id: "quote",
                label: "Quote",
                tag: "blockquote",
                className: "wby-quote-1"
            }
        ],
        lists: [{ id: "list", label: "List 1", tag: "ul", className: "wby-list-1" }]
    },
    lexicalTokenPrefix: "WebinyLexical__"
});
