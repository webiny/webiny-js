import useGqlHandler from "./useGqlHandler";
import useUpdateSettingsHandler from "../updateSettings/useHandler";

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

    test("full URL must be returned correctly when only default settings exist", async () => {
        const { handler } = useUpdateSettingsHandler();

        await handler({
            data: {
                name: "test 1",
                websiteUrl: "https://www.test.com/",
                websitePreviewUrl: "https://preview.test.com/",
                prerendering: {
                    app: {
                        url: "https://www.app.com/"
                    },
                    storage: { name: "storage-name" }
                }
            }
        });

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

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { url: expect.stringMatching(/^https:\/\/www.test.com\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^https:\/\/www.test.com\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^https:\/\/www.test.com\/some-url\/untitled-/) }
            ])
        );

        await updateSettings({ data: { websiteUrl: "https://updated-domain.com" } });

        await until(listPages, ([res]) =>
            res.data.pageBuilder.listPages.data[0].url.startsWith("https://updated-domain")
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { url: /^https:\/\/updated-domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/updated-domain.com\/some-url\/untitled-/ },
                { url: /^https:\/\/updated-domain.com\/some-url\/untitled-/ }
            ])
        );
    });
});
