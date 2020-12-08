import useGqlHandler from "./useGqlHandler";

describe("listing latest pages", () => {
    const { oEmbedData } = useGqlHandler();

    test("YouTube test", async () => {
        const [response] = await oEmbedData({ url: "https://www.youtube.com/watch?v=N9fTYUj8pLE" });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    oembedData: {
                        data: {
                            thumbnail_url: "https://i.ytimg.com/vi/N9fTYUj8pLE/hqdefault.jpg",
                            type: "video",
                            version: "1.0",
                            provider_url: "https://www.youtube.com/",
                            author_name: "lzuniy",
                            provider_name: "YouTube",
                            height: 270,
                            thumbnail_height: 360,
                            author_url: "https://www.youtube.com/user/Izuniy",
                            width: 480,
                            thumbnail_width: 480,
                            html:
                                '<iframe width="480" height="270" src="https://www.youtube.com/embed/N9fTYUj8pLE?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
                            title:
                                "CYBERPUNK 2077 - 50 Minutes Open-World [4K] Gameplay Walkthough Boss Fight",
                            source: {
                                url: "https://www.youtube.com/watch?v=N9fTYUj8pLE"
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
});
