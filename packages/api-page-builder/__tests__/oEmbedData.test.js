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
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            author_name: "Webiny",
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            author_url: "https://www.youtube.com/c/Webiny",
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            provider_name: "YouTube",
                            // eslint-disable-next-line @typescript-eslint/camelcase
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
