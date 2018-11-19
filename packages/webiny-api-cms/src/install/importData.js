// @flow
import setupEntities from "../entities/setupEntities";

export default async (context: Object) => {
    const { Category, Element, Page, Tag } = setupEntities(context);

    ["nodejs", "graphql", "marketing"].forEach(async tag => {
        const t = new Tag();
        t.populate({ name: tag });
        await t.save();
    });

    const blogCategory = new Category();
    blogCategory.populate({
        name: "Blog",
        slug: "blog",
        url: "/blog/",
        layout: "blog"
    });
    await blogCategory.save();

    const staticCategory = new Category();
    staticCategory.populate({
        name: "Static",
        slug: "static",
        url: "/",
        layout: "static"
    });
    await staticCategory.save();

    const page = new Page();
    page.populate({
        title: "Demo blog post",
        category: blogCategory
    });
    await page.save();

    const element = new Element();
    element.populate({
        name: "Custom text",
        group: "cms-element-group-saved",
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
