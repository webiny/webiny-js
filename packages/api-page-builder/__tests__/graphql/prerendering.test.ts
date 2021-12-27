import useGqlHandler from "./useGqlHandler";
import { createPrerenderingHandlers, PrerenderingTracking } from "./mocks/prerendering";
import { Menu, Page } from "~/types";

describe("make sure that prerendering render and flush are running", () => {
    const tracking = new PrerenderingTracking();

    const handler = useGqlHandler({
        plugins: [createPrerenderingHandlers(tracking)]
    });

    beforeEach(() => {
        tracking.reset();
    });

    const createPage = async (): Promise<Page> => {
        const { createCategory } = useGqlHandler();
        const [categoryResponse] = await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
        const category = categoryResponse.data.pageBuilder.createCategory.data;

        const [response] = await handler.createPage({
            category: category.slug
        });
        return response.data.pageBuilder.createPage.data;
    };

    const publishPage = async (page: Page): Promise<Page> => {
        const [response] = await handler.publishPage({
            id: page.id
        });

        return response.data.pageBuilder.publishPage.data;
    };

    const unpublishPage = async (page: Page): Promise<Page> => {
        const [response] = await handler.unpublishPage({
            id: page.id
        });

        return response.data.pageBuilder.unpublishPage.data;
    };

    const deletePage = async (page: Page): Promise<Page> => {
        const [response] = await handler.deletePage({
            id: page.id
        });

        return response.data.pageBuilder.deletePage.data;
    };

    const createMenu = async (): Promise<Menu> => {
        const [response] = await handler.createMenu({
            data: {
                slug: `slug`,
                title: `title`,
                description: `description`,
                items: []
            }
        });

        return response.data.pageBuilder.createMenu.data;
    };

    const updateMenu = async (menu: Menu, data: Record<string, any>): Promise<Menu> => {
        const [response] = await handler.updateMenu({
            slug: `slug`,
            data: {
                title: menu.title,
                slug: menu.slug,
                description: menu.description,
                ...data
            }
        });

        return response.data.pageBuilder.updateMenu.data;
    };

    it("should run render on page publish", async () => {
        const page = await createPage();

        await publishPage(page);
        expect(tracking.getCount("render")).toEqual(1);
        expect(tracking.getCount("flush")).toEqual(0);
    });

    it("should run render and flush on page unpublish", async () => {
        const page = await createPage();
        await publishPage(page);
        tracking.reset();

        await unpublishPage(page);
        expect(tracking.getCount("render")).toEqual(0);
        expect(tracking.getCount("flush")).toEqual(1);
    });

    it("should run flush on published page delete", async () => {
        const page = await createPage();
        await publishPage(page);
        tracking.reset();

        await deletePage(page);
        expect(tracking.getCount("render")).toEqual(0);
        expect(tracking.getCount("flush")).toEqual(1);
    });

    it("should run render when added or removed items from the menu", async () => {
        const menu = await createMenu();
        expect(tracking.getCount("render")).toEqual(0);
        expect(tracking.getCount("flush")).toEqual(0);

        const updatedMenu = await updateMenu(menu, {
            items: [
                {
                    someKey: "value"
                }
            ]
        });

        expect(tracking.getCount("render")).toEqual(1);
        expect(tracking.getCount("flush")).toEqual(0);
        tracking.reset();

        await updateMenu(updatedMenu, {
            items: []
        });
        expect(tracking.getCount("render")).toEqual(1);
        expect(tracking.getCount("flush")).toEqual(0);
    });
});
