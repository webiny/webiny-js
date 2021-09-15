import useGqlHandler from "./useGqlHandler";
import { PrerenderingPageMethodsPlugin, PrerenderingTracking } from "./mocks/prerendering";
import { Page } from "~/types";

describe("make sure that prerendering render and flush are running", () => {
    const tracking = new PrerenderingTracking();

    const handler = useGqlHandler({
        plugins: [new PrerenderingPageMethodsPlugin(tracking)]
    });

    beforeEach(() => {
        tracking.reset();
    });

    const createPage = async (): Promise<Page> => {
        const [categoryResponse] = await handler.createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });
        const category = categoryResponse.data.pageBuilder.createCategory.data;

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        return createResponse.data.pageBuilder.createPage.data;
    };

    const publishPage = async (page: Page): Promise<Page> => {
        const [publishResponse] = await handler.publishPage({
            id: page.id
        });

        return publishResponse.data.pageBuilder.publishPage.data;
    };

    const unpublishPage = async (page: Page): Promise<Page> => {
        const [unpublishResponse] = await handler.unpublishPage({
            id: page.id
        });

        return unpublishResponse.data.pageBuilder.unpublishPage.data;
    };

    const deletePage = async (page: Page): Promise<Page> => {
        const [deleteResponse] = await handler.deletePage({
            id: page.id
        });

        return deleteResponse.data.pageBuilder.deletePage.data;
    };

    it("should run render on page publish", async () => {
        const page = await createPage();

        await publishPage(page);

        expect(tracking.getCount("render")).toEqual(2);
        expect(tracking.getCount("flush")).toEqual(0);
    });

    it("should run render and flush on page unpublish", async () => {
        const page = await createPage();
        await publishPage(page);
        tracking.reset();

        await unpublishPage(page);
        expect(tracking.getCount("render")).toEqual(1);
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
});
