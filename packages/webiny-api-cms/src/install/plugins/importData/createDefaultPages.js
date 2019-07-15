// @flow
import get from "lodash/get";
import fs from "fs-extra";
import path from "path";
import { categories, pages, menus, files } from "./pages";

const createDefaultPage = async ({ page, data }) => {
    page.populate({ ...data });
    await page.save();
    page.published = true;
    await page.save();

    return page;
};

const createDefaultPages = async (context: Object, { cmsSettings }: Object) => {
    const { Page, Category, Menu } = context.cms.entities;
    const { File } = context.files.entities;

    // Insert categories
    for (let i = 0; i < categories.length; i++) {
        const category = new Category();
        category.populate(categories[i]);
        await category.save();
    }

    // Insert menus
    for (let i = 0; i < menus.length; i++) {
        const menu = new Menu();
        menu.populate(menus[i]);
        await menu.save();
    }

    // Insert files
    for (let i = 0; i < files.length; i++) {
        const file = new File();
        file.populate(files[i]);
        await file.save();
    }

    cmsSettings.data = {
        pages: {}
    };

    for (let i = 0; i < pages.length; i++) {
        const data = pages[i];
        if (data.settings.general.tags && data.settings.general.tags.includes("homepage")) {
            const page = await createDefaultPage({ page: new Page(), data });
            cmsSettings.data.pages.home = page.id;
            continue;
        }

        if (data.settings.general.tags && data.settings.general.tags.includes("error")) {
            const page = await createDefaultPage({ page: new Page(), data });
            cmsSettings.data.pages.error = page.id;
            continue;
        }

        if (data.settings.general.tags && data.settings.general.tags.includes("404")) {
            const page = await createDefaultPage({ page: new Page(), data });
            cmsSettings.data.pages.notFound = page.id;
            continue;
        }

        await createDefaultPage({ page: new Page(), data });
    }

    // Copy images.
    if (get(context, "cms.copyFiles", true) !== false) {
        const folder: string = path.resolve(get(context, "cms.copyFilesTo") || ".files");
        await fs.copy(`${__dirname}/pages/images`, folder);
    }
};

export default createDefaultPages;
