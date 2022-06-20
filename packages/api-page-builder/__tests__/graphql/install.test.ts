import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";
import { Page } from "~/types";

describe("Install Test", () => {
    const handler = useGqlHandler();

    const {
        isInstalled,
        install,
        listCategories,
        listPages,
        listPublishedPages,
        getPage,
        getPublishedPage,
        until,
        getSettings
    } = handler;

    test("should be able to get app version anonymously, but not install", async () => {
        const { isInstalled, install } = useGqlHandler({
            permissions: []
        });

        const [isInstalledResponse] = await isInstalled();

        expect(isInstalledResponse).toEqual({
            data: {
                pageBuilder: {
                    version: null
                }
            }
        });

        const [installResponse] = await install({
            data: {
                name: "My Site"
            }
        });

        expect(installResponse.data.pageBuilder.install.error.message).toBe("Not authorized!");
    });

    test("make sure installation creates initial resources and marks the app as installed", async () => {
        const [isInstalledCheckResponse] = await isInstalled();

        expect(isInstalledCheckResponse).toEqual({
            data: {
                pageBuilder: {
                    version: null
                }
            }
        });

        const [installResponse] = await install({
            data: {
                name: "My Website"
            }
        });

        expect(installResponse).toEqual({
            data: {
                pageBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [isInstalledResponse] = await isInstalled();

        expect(isInstalledResponse).toEqual({
            data: {
                pageBuilder: {
                    version: expect.any(String)
                }
            }
        });

        // 1. Installation must create the initial Static category.
        const [listCategoriesResponse] = await listCategories();

        expect(listCategoriesResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listCategories: {
                        data: [
                            {
                                slug: "static",
                                url: "/static/",
                                name: "Static",
                                layout: "static",
                                createdBy: defaultIdentity
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // 2. Only homepage should be visible in published and latest pages.
        const [listPagesAfterInstallResponse] = await until(
            listPages,
            ([res]: any) => {
                const { data } = res.data.pageBuilder.listPages;
                return data.length === 2 && data.every((p: Page) => p.status === "published");
            },
            {
                name: "list pages after listing categories"
            }
        );

        // Create a reusable assertion function
        const assertPages = (pages: Page[]) => {
            expect(pages.every(p => p.status === "published")).toBe(true);
            expect(pages.some(p => p.title === "Welcome to Webiny")).toBe(true);
            expect(pages.some(p => p.title === "Not Found")).toBe(true);
        };

        let pages: Page[] = listPagesAfterInstallResponse.data.pageBuilder.listPages.data;
        assertPages(pages);

        const [publishedPages] = await until(
            listPublishedPages,
            ([res]: any) => {
                const { data } = res.data.pageBuilder.listPublishedPages;
                return data.length === 2 && data.every((p: Page) => p.status === "published");
            },
            {
                name: "list published pages after listing categories"
            }
        );

        pages = publishedPages.data.pageBuilder.listPublishedPages.data;
        assertPages(pages);

        // 3. Let's get the ID of the not-found page and try to get it directly.
        const settings = await getSettings().then(([res]) => res.data.pageBuilder.getSettings.data);

        const [getNotFoundPageResponse] = await getPage({ id: settings.pages.notFound });
        const page: Page = getNotFoundPageResponse.data.pageBuilder.getPage.data;
        expect(page.title).toBe("Not Found");
        expect(page.status).toBe("published");

        const [notFoundPageResponse] = await getPublishedPage({ id: settings.pages.notFound });
        const notFoundPage: Page = notFoundPageResponse.data.pageBuilder.getPublishedPage.data;

        expect(notFoundPage.title).toBe("Not Found");
        expect(notFoundPage.status).toBe("published");

        // 4. Installation must set the "Website" name.
        const [getSettingsResponse] = await getSettings();

        expect(getSettingsResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getSettings: {
                        data: {
                            name: "My Website"
                        }
                    }
                }
            }
        });
    });
});
