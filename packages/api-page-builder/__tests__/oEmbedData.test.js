import useGqlHandler from "./useGqlHandler";

describe("oEmbed test", () => {
    const { oEmbedData } = useGqlHandler();

    test("YouTube test", async () => {
        const [response] = await oEmbedData({ url: "https://www.youtube.com/watch?v=sF4HRS9nE3s" });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    oembedData: {
                        data: {
                            author_name: "Webiny",
                            author_url: "https://www.youtube.com/c/Webiny",
                            height: 270,
                            html:
                                '<iframe width="480" height="270" src="https://www.youtube.com/embed/sF4HRS9nE3s?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
                            provider_name: "YouTube",
                            provider_url: "https://www.youtube.com/",
                            source: {
                                url: "https://www.youtube.com/watch?v=sF4HRS9nE3s"
                            },
                            thumbnail_height: 360,
                            thumbnail_url: "https://i.ytimg.com/vi/sF4HRS9nE3s/hqdefault.jpg",
                            thumbnail_width: 480,
                            title: "Webiny Serverless Apps",
                            type: "video",
                            version: "1.0",
                            width: 480
                        },
                        error: null
                    }
                }
            }
        });
    });
});
