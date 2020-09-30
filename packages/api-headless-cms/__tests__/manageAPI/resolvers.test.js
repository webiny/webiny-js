import createCategories from "../mocks/genericContentModels/categories.manage";
import { locales } from "../mocks/I18NLocales";
import { Database } from "@commodo/fields-storage-nedb";
import useContentHandler from "./../utils/useContentHandler";
import contentModels from "./../mocks/genericContentModels/contentModels";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("MANAGE - Resolvers", () => {
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });

        const { createContentModel, content } = environmentManage(initial.environment.id);
        const [categoryModel] = contentModels();

        await createContentModel({ data: categoryModel });

        initial.categories = await createCategories({ content });
    });

    test(`get category by ID`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data = await categories.read({ id: initial.categories[0].id });

        expect(data).toMatchObject({
            id: initial.categories[0].id,
            title: initial.categories[0].title,
            slug: initial.categories[0].slug
        });
    });

    test(`list categories (no parameters)`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list();

        expect(data).toEqual([
            {
                id: data[0].id,
                savedOn: data[0].savedOn,
                meta: {
                    title: {
                        value: "B Category EN"
                    },
                    published: false,
                    version: 1,
                    parent: data[0].id,
                    status: "draft"
                }
            },
            {
                id: data[1].id,
                savedOn: data[1].savedOn,
                meta: {
                    title: {
                        value: "A Category EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[1].id,
                    status: "published"
                }
            },
            {
                id: data[2].id,
                savedOn: data[2].savedOn,
                meta: {
                    title: {
                        value: "Hardware EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[2].id,
                    status: "published"
                }
            }
        ]);
    });

    test(`list entries (limit)`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list({ limit: 1 });

        expect(data).toEqual([
            {
                id: data[0].id,
                savedOn: data[0].savedOn,
                meta: {
                    title: {
                        value: "B Category EN"
                    },
                    published: false,
                    version: 1,
                    parent: data[0].id,
                    status: "draft"
                }
            }
        ]);
    });

    test(`list categories (sort ASC)`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list({ sort: ["slug_ASC"] });

        expect(data).toEqual([
            {
                id: data[0].id,
                savedOn: data[0].savedOn,
                meta: {
                    title: {
                        value: "A Category EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[0].id,
                    status: "published"
                }
            },
            {
                id: data[1].id,
                savedOn: data[1].savedOn,
                meta: {
                    title: {
                        value: "B Category EN"
                    },
                    published: false,
                    version: 1,
                    parent: data[1].id,
                    status: "draft"
                }
            },
            {
                id: data[2].id,
                savedOn: data[2].savedOn,
                meta: {
                    title: {
                        value: "Hardware EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[2].id,
                    status: "published"
                }
            }
        ]);
    });

    test(`list categories (sort DESC)`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list({ sort: ["slug_DESC"] });

        expect(data).toEqual([
            {
                id: data[0].id,
                savedOn: data[0].savedOn,
                meta: {
                    title: {
                        value: "Hardware EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[0].id,
                    status: "published"
                }
            },
            {
                id: data[1].id,
                savedOn: data[1].savedOn,
                meta: {
                    title: {
                        value: "B Category EN"
                    },
                    published: false,
                    version: 1,
                    parent: data[1].id,
                    status: "draft"
                }
            },
            {
                id: data[2].id,
                savedOn: data[2].savedOn,
                meta: {
                    title: {
                        value: "A Category EN"
                    },
                    published: true,
                    version: 1,
                    parent: data[2].id,
                    status: "published"
                }
            }
        ]);
    });

    test(`list categories (contains, not_contains, in, not_in)`, async () => {
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        const data1 = await categories.list({
            where: { slug_contains: "category" }
        });

        expect(data1.length).toBe(2);

        // TODO: cannot write this query in neDB (throws an error).
        // TODO: @see packages/api-headless-cms/src/content/plugins/filterOperators/operatorNotContains.ts
        /*const data2 = await categories.list({
            where: { slug_not_contains: "category" }
        });

        expect(data2.length).toBe(1);*/

        const data3 = await categories.list({
            where: { slug_in: "b-category-en" }
        });

        expect(data3.length).toBe(1);

        const data4 = await categories.list({
            where: {
                slug_not_in: ["a-category-en", "a-category-de", "b-category-en", "b-category-de"]
            }
        });

        expect(data4.length).toBe(1);
        expect(data4[0].meta.title.value).toBe("Hardware EN");
    });

    test(`create category`, async () => {
        const query = /* GraphQL */ `
            mutation CreateCategory($data: CategoryInput!) {
                createCategory(data: $data) {
                    data {
                        id
                        title {
                            values {
                                locale
                                value
                            }
                            enValue: value(locale: "en-US")
                            deValue: value(locale: "de-DE")
                        }
                        slug {
                            values {
                                locale
                                value
                            }
                            enValue: value(locale: "en-US")
                            deValue: value(locale: "de-DE")
                        }
                    }
                }
            }
        `;

        const { invoke } = environmentManage(initial.environment.id);

        let [body] = await invoke({
            body: {
                query,
                variables: {
                    data: {
                        title: {
                            values: [
                                { locale: locales.en.id, value: "Random EN" },
                                { locale: locales.de.id, value: "Random DE" }
                            ]
                        },
                        slug: {
                            values: [
                                { locale: locales.en.id, value: "random-en" },
                                { locale: locales.de.id, value: "random-de" }
                            ]
                        }
                    }
                }
            }
        });

        expect(body.data.createCategory).toMatchObject({
            data: {
                id: expect.stringMatching("^[0-9a-fA-F]{24}"),
                title: {
                    values: [
                        { locale: locales.en.id, value: "Random EN" },
                        { locale: locales.de.id, value: "Random DE" }
                    ],
                    enValue: "Random EN",
                    deValue: "Random DE"
                },
                slug: {
                    values: [
                        { locale: locales.en.id, value: "random-en" },
                        { locale: locales.de.id, value: "random-de" }
                    ],
                    enValue: "random-en",
                    deValue: "random-de"
                }
            }
        });
    });

    test(`update category (by ID, by slug)`, async () => {
        const query = /* GraphQL */ `
            mutation UpdateCategory($where: CategoryUpdateWhereInput!, $data: CategoryInput!) {
                updateCategory(where: $where, data: $data) {
                    data {
                        id
                        title {
                            values {
                                locale
                                value
                            }
                            enValue: value(locale: "en-US")
                            deValue: value(locale: "de-DE")
                        }
                    }
                    error {
                        code
                        message
                    }
                }
            }
        `;

        const { invoke } = environmentManage(initial.environment.id);

        let [body1] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        slug: initial.categories[0].slug.values[0].value
                    },
                    data: {
                        title: {
                            values: [
                                { locale: locales.en.id, value: "Software EN" },
                                { locale: locales.de.id, value: "Software DE" }
                            ]
                        }
                    }
                }
            }
        });

        expect(body1.data.updateCategory).toMatchObject({
            data: {
                id: expect.stringMatching("^[0-9a-fA-F]{24}"),
                title: {
                    values: [
                        { locale: locales.en.id, value: "Software EN" },
                        { locale: locales.de.id, value: "Software DE" }
                    ],
                    enValue: "Software EN",
                    deValue: "Software DE"
                }
            }
        });

        let [body2] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        id: body1.data.updateCategory.data.id
                    },
                    data: {
                        title: {
                            values: [
                                { locale: locales.en.id, value: "Random EN" },
                                { locale: locales.de.id, value: "Random DE" }
                            ]
                        }
                    }
                }
            }
        });

        expect(body2.data.updateCategory).toMatchObject({
            data: {
                id: expect.stringMatching("^[0-9a-fA-F]{24}"),
                title: {
                    values: [
                        { locale: locales.en.id, value: "Random EN" },
                        { locale: locales.de.id, value: "Random DE" }
                    ],
                    enValue: "Random EN",
                    deValue: "Random DE"
                }
            }
        });
    });

    test(`delete category (by ID, by slug)`, async () => {
        const database = new Database();
        const { environment: environmentManage } = useContentHandler({ database });

        const initial = {};

        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });

        const { createContentModel, invoke, content } = environmentManage(initial.environment.id);
        const [categoryModel] = contentModels();

        await createContentModel({ data: categoryModel });

        initial.categories = await createCategories({ content });

        const query = /* GraphQL */ `
            mutation DeleteCategory($where: CategoryDeleteWhereInput!) {
                deleteCategory(where: $where) {
                    data
                }
            }
        `;

        const categories = await content("category");
        expect((await categories.list()).length).toBe(3);

        let [body] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        slug: "hardware-en"
                    }
                }
            }
        });

        expect(body.data.deleteCategory).toMatchObject({
            data: true
        });

        expect((await categories.list()).length).toBe(2);
    });
});
