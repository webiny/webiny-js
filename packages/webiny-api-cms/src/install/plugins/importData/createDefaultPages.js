// @flow
import { notFound, homepage, error } from "./staticPages";

const createDefaultPage = async ({ page, data, category }) => {
    page.populate({ ...data, category });
    await page.save();

    page.published = true;
    await page.save();

    return page;
};

const createDefaultPages = async (context: Object, { categories, cmsSettings }: Object) => {
    const { Page } = context.cms.entities;

    // Create default pages - demo blog, error, not found and homepage and also assign to settings.
    const demoBlogPage = new Page();
    demoBlogPage.populate({
        title: "Demo blog post",
        category: categories.blog
    });
    await demoBlogPage.save();

    cmsSettings.data = {
        pages: {
            home: (await createDefaultPage({
                page: new Page(),
                data: homepage,
                category: categories.static
            })).id,
            error: (await createDefaultPage({
                page: new Page(),
                data: error,
                category: categories.static
            })).id,
            notFound: (await createDefaultPage({
                page: new Page(),
                data: notFound,
                category: categories.static
            })).id
        }
    };
};

export default createDefaultPages;
