import useGqlHandler from "./useGqlHandler";
import useUpdateSettingsHandler from "../updateSettings/useHandler";

let ids = [];
describe("page full URL test", () => {
    const {
        createCategory,
        createPage,
        updateSettings,
        publishPage,
        listPages,
        listPublishedPages,
        updatePage,
        until
    } = useGqlHandler();

    beforeEach(async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        ids = [];
        for (let i = 0; i < 3; i++) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;
            ids.push(id);
            await updatePage({
                id,
                data: {
                    title: `page-${i}`
                }
            });
        }
    });

    afterEach(async () => {
        ids = [];
    });

    test("full URL must be returned correctly", async () => {
        await updateSettings({ data: { websiteUrl: "https://domain.com" } });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 3).then(
            ([res]) =>
                expect(res.data.pageBuilder.listPages.data).toMatchObject([
                    { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
                    { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
                    { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) }
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
                { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) }
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

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 3).then(
            ([res]) =>
                expect(res.data.pageBuilder.listPages.data).toMatchObject([
                    {
                        url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/)
                    },
                    {
                        url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/)
                    },
                    { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) }
                ])
        );

        await updateSettings({ data: { websiteUrl: "https://updated-domain.com" } });

        await until(listPages, ([res]) =>
            res.data.pageBuilder.listPages.data[0].url.startsWith("https://updated-domain")
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                {
                    url: expect.stringMatching(
                        /^https:\/\/updated-domain\.com\/some-url\/untitled-/
                    )
                },
                {
                    url: expect.stringMatching(
                        /^https:\/\/updated-domain\.com\/some-url\/untitled-/
                    )
                },
                {
                    url: expect.stringMatching(
                        /^https:\/\/updated-domain\.com\/some-url\/untitled-/
                    )
                }
            ])
        );
    });

    test("`null` must no be part of the page URL", async () => {
        // Ensure that a settings entry exists in the database.
        await updateSettings({ data: {} });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 3).then(
            ([res]) =>
                expect(res.data.pageBuilder.listPages.data).toMatchObject([
                    { url: expect.stringMatching(/^\/some-url\/untitled-/) },
                    { url: expect.stringMatching(/^\/some-url\/untitled-/) },
                    { url: expect.stringMatching(/^\/some-url\/untitled-/) }
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
                { url: expect.stringMatching(/^\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^\/some-url\/untitled-/) },
                { url: expect.stringMatching(/^\/some-url\/untitled-/) }
            ])
        );
    });
});
