import useGqlHandler from "./useGqlHandler";

describe("page full URL test", () => {
    const {
        createElasticSearchIndex,
        deleteElasticSearchIndex,
        createCategory,
        createPage,
        updateSettings,
        publishPage,
        listPages,
        listPublishedPages,
        updatePage,
        until
    } = useGqlHandler();

    beforeAll(async () => {
        await deleteElasticSearchIndex();
    });

    beforeEach(async () => {
        await createElasticSearchIndex();
    });

    afterEach(async () => {
        await deleteElasticSearchIndex();
    });

    test("full URL must be returned correctly", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b"];
        const ids = [];
        for (let i = 0; i < letters.length; i++) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;
            ids.push(id);
            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });
        }

        await updateSettings({ data: { websiteUrl: "https://domain.com" } });

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ }
            ])
        );

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            await publishPage({
                id
            });
        }

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/domain.com\/some-url\/untitled-/ }
            ])
        );
    });
});
