// @flow
import get from "lodash/get";
import fs from "fs-extra";
import { categories, pages } from "./pages";

const createDefaultPage = async ({ page, data }) => {
    page.populate({ ...data });
    await page.save();

    page.published = true;
    await page.save();

    return page;
};

const createDefaultPages = async (context: Object, { cmsSettings }: Object) => {
    const { Page, Category } = context.cms.entities;

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const cat = new Category();
        cat.populate(category);
        await cat.save();
    }

    const homePageIndex = pages.findIndex(
        p => p.settings.general.tags && p.settings.general.tags.includes("homepage")
    );
    const homePage = pages.splice(homePageIndex, 1)[0];

    const errorPageIndex = pages.findIndex(
        p => p.settings.general.tags && p.settings.general.tags.includes("error")
    );
    const errorPage = pages.splice(errorPageIndex, 1)[0];

    const notFoundPageIndex = pages.findIndex(
        p => p.settings.general.tags && p.settings.general.tags.includes("404")
    );
    const notFoundPage = pages.splice(notFoundPageIndex, 1)[0];

    for (let i = 0; i < pages.length; i++) {
        await createDefaultPage({
            page: new Page(),
            data: pages[i]
        });
    }

    cmsSettings.data = {
        pages: {
            home: (await createDefaultPage({
                page: new Page(),
                data: homePage
            })).id,
            error: (await createDefaultPage({
                page: new Page(),
                data: errorPage
            })).id,
            notFound: (await createDefaultPage({
                page: new Page(),
                data: notFoundPage
            })).id
        }
    };

    // Copy images.
    if (get(context, "cms.copyFiles", true) !== false) {
        const pwd: string = (process.cwd(): any);
        await fs.copy(`${__dirname}/pages/images`, pwd + "/static");
    }
};

export default createDefaultPages;
