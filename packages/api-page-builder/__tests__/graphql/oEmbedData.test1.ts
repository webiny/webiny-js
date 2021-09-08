import useGqlHandler from "./useGqlHandler";

describe("oEmbed test", () => {
    const { oEmbedData } = useGqlHandler();

    test("YouTube test", async () => {
        const [response] = await oEmbedData({ url: "https://www.youtube.com/watch?v=sF4HRS9nE3s" });
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    oembedData: {
                        data: {
                            author_name: "Webiny",

                            author_url: /^https:\/\/www\.youtube\.com/,

                            provider_name: "YouTube",

                            provider_url: "https://www.youtube.com/",
                            source: {
                                url: "https://www.youtube.com/watch?v=sF4HRS9nE3s"
                            },
                            title: "Webiny Serverless Apps"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
