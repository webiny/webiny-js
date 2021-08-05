import useHandler from "./useHandler";

describe("Update Settings Handler Test", () => {
    const { handler } = useHandler();

    test("update settings", async () => {
        const result = await handler({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com/",
                websitePreviewUrl: "https://preview.test.com/",
                prerendering: {
                    app: {
                        url: "https://www.app.com/"
                    },
                    storage: { name: "storage-name" }
                },
                social: {
                    facebook: "https://www.facebook.com/",
                    instagram: "https://www.instagram.com/",
                    twitter: "https://www.twitter.com/",
                    image: {
                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                    }
                }
            }
        });

        expect(result).toEqual({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com",
                websitePreviewUrl: "https://preview.test.com",
                favicon: null,
                logo: null,
                prerendering: {
                    meta: null,
                    app: {
                        url: "https://www.app.com"
                    },
                    storage: {
                        name: "storage-name"
                    }
                },
                social: {
                    facebook: "https://www.facebook.com/",
                    twitter: "https://www.twitter.com/",
                    instagram: "https://www.instagram.com/",
                    image: {
                        id: "1kucKwtX3vI2w6tYuPwJsvRFn9g",
                        src: "https://d1peg08dnrinui.cloudfront.net/files/9ki1goobp-webiny_security__1_.png"
                    }
                },
                pages: {
                    home: null,
                    notFound: null
                }
            },
            error: null
        });
    });
});
