// @flow
import setupEntities from "./setupEntities";
import createDefaultPages from "./importData/createDefaultPages";
import createDefaultBlocks from "./importData/createDefaultBlocks";
import * as data from "./data";

export default async (context: Object) => {
    setupEntities(context);
    const { Category, Tag, Menu, CmsSettings } = context.cms.entities;

    const { Group } = context.security.entities;

    // Create Full Access security group with all of the necessary roles.
    const group = new Group();
    group.populate({ ...data.group, roles: data.roles }).save();

    const menu = new Menu();
    menu.populate({
        title: "Demo Menu",
        slug: "demo-menu",
        description: "This is a demo menu.",
        items: [
            {
                type: "cms-menu-item-link",
                title: "Link 1",
                url: "https://www.google.com",
                id: "jopxai1f"
            },
            {
                type: "cms-menu-item-link",
                title: "Link 2",
                url: "https://www.duckduckgo.com",
                id: "jopxaxqh"
            }
        ]
    });

    await menu.save();

    ["nodejs", "graphql", "marketing"].forEach(async tag => {
        const t = new Tag();
        t.populate({ name: tag });
        await t.save();
    });

    const categories = {
        blog: new Category(),
        static: new Category()
    };

    await categories.blog
        .populate({
            name: "Blog",
            slug: "blog",
            url: "/blog/",
            layout: "blog"
        })
        .save();

    await categories.static
        .populate({
            name: "Static",
            slug: "static",
            url: "/",
            layout: "static"
        })
        .save();

    await createDefaultBlocks(context);

    // Settings init.
    const cmsSettings = new CmsSettings();
    await createDefaultPages(context, { categories, cmsSettings });
    cmsSettings.data.domain = "http://localhost:3002";

    await cmsSettings.save();
};
