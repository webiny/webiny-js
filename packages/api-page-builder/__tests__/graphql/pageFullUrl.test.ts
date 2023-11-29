import useGqlHandler from "./useGqlHandler";
import { Page } from "~/types";

jest.setTimeout(100000);

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
        install,
        until
    } = handler;

    const createInitialData = async () => {
        await install();
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

            const [updateResponse] = await updatePage({
                id: page.id,
                data: {
                    title: `page-${i}`
                }
            });
            const updatedPage = updateResponse.data.pageBuilder.updatePage.data;

            pages.push(updatedPage);
        }

        return pages;
    };

    test("full URL must be returned correctly", async () => {
        const initialPages = await createInitialData();
        const websiteUrl = "https://domain.com";
        const [updateSettingsResponse] = await updateSettings({
            data: {
                websiteUrl
            }
        });

        expect(updateSettingsResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: {
                            websiteUrl
                        },
                        error: null
                    }
                }
            }
        });

        const [listPagesAfterUpdateSettingsResponse] = await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        );
        expect(listPagesAfterUpdateSettingsResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id: initialPages[2].id,
                                url: expect.stringMatching(
                                    /^https:\/\/domain.com\/some-url\/untitled-/
                                )
                            },
                            {
                                id: initialPages[1].id,
                                url: expect.stringMatching(
                                    /^https:\/\/domain.com\/some-url\/untitled-/
                                )
                            },
                            {
                                id: initialPages[0].id,
                                url: expect.stringMatching(
                                    /^https:\/\/domain.com\/some-url\/untitled-/
                                )
                            }
                        ],
                        error: null
                    }
                }
            }
        });
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

        const [listPagesAfterFirstSettingsUpdate] = await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "list pages after first settings update"
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
                name: "list pages after domain change"
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

    test("`null` must not be part of the page URL", async () => {
        const initialPages = await createInitialData();
        // Ensure that a settings entry exists in the database.
        await updateSettings({ data: {} });

        const [listPagesResponse] = await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 3,
            {
                name: "List pages after update empty settings"
            }
        );

        expect(listPagesResponse.data.pageBuilder.listPages.data).toMatchObject([
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) }
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
                name: "list pages after published pages"
            }
        );

        expect(listPublishedPagesResponse.data.pageBuilder.listPublishedPages.data).toMatchObject([
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) },
            { url: expect.stringMatching(/^https:\/\/www\.test\.com\/some-url\/untitled-/) }
        ]);
    });
});
