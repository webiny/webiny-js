export const richTextData = {
    editor: "webiny",
    data: [
        {
            tag: "h1",
            content: "h1 title"
        },
        {
            tag: "p",
            content: "paragraph text"
        },
        {
            tag: "div",
            content: [
                {
                    tag: "p",
                    content: "content paragraph text"
                },
                {
                    tag: "a",
                    content: "some url",
                    href: "https://www.webiny.com/"
                }
            ]
        }
    ]
};
export const simpleRichTextData = {
    editor: "webiny",
    data: [
        {
            tag: "h1",
            content: "title"
        }
    ]
};

export const fileData = {
    id: "12345678",
    key: "12345678/filenameA.png",
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch"],
    aliases: [],
    richText: richTextData
};
/**
 * Add fields that are added via the plugins, so we get them back in the result.
 */
export const extraFields = ["richText {editor data}"];
