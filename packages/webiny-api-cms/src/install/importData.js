// @flow
import setupEntities from "./setupEntities";
import createDefaultPages from "./importData/createDefaultPages";

export default async (context: Object) => {
    setupEntities(context);
    const { Category, Element, Tag, Menu } = context.cms.entities;

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

    await createDefaultPages(context, { categories });

    // Create sample element.
    const element = new Element();
    element.populate({
        name: "Custom text",
        group: "cms-element-group-saved",
        category: "cms-block-category-general",
        type: "element",
        content: {
            data: {
                text: {
                    object: "value",
                    document: {
                        object: "document",
                        data: {},
                        nodes: [
                            {
                                object: "block",
                                type: "h4",
                                data: {},
                                nodes: [
                                    {
                                        object: "text",
                                        leaves: [
                                            {
                                                object: "leaf",
                                                text: "Second revision",
                                                marks: []
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            settings: {
                style: {
                    padding: "20px"
                }
            },
            elements: [],
            type: "cms-element-text"
        }
    });
    await element.save();
};
