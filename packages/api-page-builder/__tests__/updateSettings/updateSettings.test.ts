import useHandler from "./useHandler";

describe("Update Settings Handler Test", () => {
    const { handler } = useHandler();

    test("update settings", async () => {
        const result = await handler(
            {
                body: JSON.stringify({
                    data: {
                        name: "test 1",
                        websiteUrl: "https://www.test.com/",
                        websitePreviewUrl: "https://preview.test.com/",
                        prerendering: {
                            app: {
                                url: "https://www.app.com/"
                            },
                            storage: { name: "storage-name" },
                            meta: {
                                cloudfront: {
                                    distributionId: "distributionId"
                                }
                            }
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
                })
            },
            {} as any
        );
        /**
         * TODO check if this is correct
         *
         * Result was not used anywhere so it did not matter.
         * Server returns response object for the Lambda
         *
         */
        expect(result).toMatchObject({
            data: true,
            error: null
        });
    });
});
