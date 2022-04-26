export const richTextMock = [
    {
        tag: "h1",
        content: "Testing H1 tags"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

export const mocks = {
    createChangeRequestInput: ({ step, title }: { step: string; title?: string }) => ({
        step: step,
        title: title || "Please replace this heading",
        body: richTextMock,
        media: {
            src: "cloudfront.net/my-file"
        }
    })
};
