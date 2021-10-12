import useGqlHandler from "./useGqlHandler";
import useUpdateSettingsHandler from "../updateSettings/useHandler";
import { Page } from "~/types";
import { waitPage } from "./utils/waitPage";

describe("page full URL test", () => {
    const handler = useGqlHandler();

    const {
        createCategory,
        createPage,
        updateSettings,
        publishPage,
        listPages,
        listPublishedPages,
        updatePage,
        until
    } = handler;

    const createInitialData = async () => {
        const pages: Page[] = [];
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        for (let i = 0; i < 3; i++) {
            const [response] = await createPage({ category: "category" });
            const page = response.data.pageBuilder.createPage.data;
            await waitPage(handler, page);
            const [updateResponse] = await updatePage({
                id: page.id,
                data: {
                    title: `page-${i}`
                }
            });
            const updatedPage = updateResponse.data.pageBuilder.updatePage.data;
            await waitPage(handler, updatedPage);
            pages.push(updatedPage);
        }

        return pages;
    };

    test("full URL must be returned correctly", async () => {
        const initialPages = await createInitialData();

        await updateSettings({ data: { websiteUrl: "https://domain.com" } });

        const [listPagesAfterUpdateSettingsResponse] = await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        );
        expect(listPagesAfterUpdateSettingsResponse.data.pageBuilder.listPages.data).toMatchObject([
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) }
        ]);

        for (const page of initialPages) {
            await publishPage({
                id: page.id
            });
        }

        const [listPublishedPagesAfterPublishResponse] = await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 3
        );

        expect(
            listPublishedPagesAfterPublishResponse.data.pageBuilder.listPublishedPages.data
        ).toMatchObject([
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/domain.com\/some-url\/untitled-/) }
        ]);
    });

    test("full URL must be returned correctly when only default settings exist", async () => {
        await createInitialData();
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

        const [listPagesAfterFirstSettingsUpdate] = await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "list pages after first settings update",
                wait: 500,
                tries: 30
            }
        );

        expect(listPagesAfterFirstSettingsUpdate.data.pageBuilder.listPages.data).toMatchObject([
            {
                url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/)
            },
            {
                url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/)
            },
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) }
        ]);

        await updateSettings({ data: { websiteUrl: "https://updated-domain.com" } });

        const [listPagesAfterSettingsUpdateResponse] = await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) =>
                res.data.pageBuilder.listPages.data[0].url.startsWith("https://updated-domain"),
            {
                name: "list pages after domain change",
                wait: 500,
                tries: 30
            }
        );

        expect(listPagesAfterSettingsUpdateResponse.data.pageBuilder.listPages.data).toMatchObject([
            {
                url: expect.stringMatching(/^https:\/\/updated-domain\.com\/some-url\/untitled-/)
            },
            {
                url: expect.stringMatching(/^https:\/\/updated-domain\.com\/some-url\/untitled-/)
            },
            {
                url: expect.stringMatching(/^https:\/\/updated-domain\.com\/some-url\/untitled-/)
            }
        ]);
    });

    test("`null` must no be part of the page URL", async () => {
        const initialPages = await createInitialData();
        // Ensure that a settings entry exists in the database.
        await updateSettings({ data: {} });

        const [listPagesResponse] = await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "List pages after update empty settings",
                wait: 500,
                tries: 30
            }
        );

        expect(listPagesResponse.data.pageBuilder.listPages.data).toMatchObject([
            { url: expect.stringMatching(/^\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^\/some-url\/untitled-/) }
        ]);

        for (const page of initialPages) {
            await publishPage({
                id: page.id
            });
        }

        const [listPublishedPagesResponse] = await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 3,
            {
                name: "list pages after published pages",
                wait: 500,
                tries: 30
            }
        );

        expect(listPublishedPagesResponse.data.pageBuilder.listPublishedPages.data).toMatchObject([
            { url: expect.stringMatching(/^\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^\/some-url\/untitled-/) }
        ]);
    });
});
