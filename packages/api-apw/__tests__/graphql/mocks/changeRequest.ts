const richTextMock = [
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
    changeRequestA: {
        step: "61af1a60f04e49226e6cc17e#design_review",
        title: "Please replace this heading",
        body: richTextMock,
        media: {
            src: "cloudfront.net/my-file"
        }
    },
    createChangeRequestInput: ({ step, title }: { step: string; title?: string }) => ({
        step: step,
        title: title || "Please replace this heading",
        body: richTextMock,
        media: {
            src: "cloudfront.net/my-file"
        }
    })
};
