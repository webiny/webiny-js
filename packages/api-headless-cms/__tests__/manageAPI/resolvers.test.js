import { graphql } from "graphql";
import get from "lodash.get";
import setupContentModels from "../setup/setupContentModels";
import { createUtils } from "../utils";
import createCategories from "../mocks/createCategories.manage";
import { locales } from "../mocks/I18NLocales";
import headlessPlugins from "../../src/handler/plugins";
import setupDefaultEnvironment from "../setup/setupDefaultEnvironment";

describe("MANAGE - Resolvers", () => {
    let categories;
    let Category;

    const { useSchema, useDatabase, useContext } = createUtils([
        headlessPlugins({ type: "manage", environment: "production" })
    ]);

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);
        const context = await useContext();
        await setupContentModels(context);
    });

    beforeEach(async () => {
        const context = await useContext();
        Category = context.models.category;
        categories = await createCategories(context);
    });

    afterEach(async () => {
        const entries = await Category.find();
        for (let i = 0; i < entries.length; i++) {
            await entries[i].delete();
        }
    });

    test(`get category by ID`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($id: ID) {
                getCategory(where: { id: $id }) {
                    data {
                        id
                        title {
                            values {
                                locale
                                value
                            }
                        }
                        slug {
                            values {
                                locale
                                value
                            }
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, {
            id: categories[0].model.id
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.getCategory).toMatchObject({
            data: {
                id: get(categories[0].data, "id"),
                title: get(categories[0].data, "fields.title"),
                slug: get(categories[0].data, "fields.slug")
            }
        });
    });

    test(`get category by slug`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title {
                            values {
                                locale
                                value
                            }
                        }
                        slug {
                            values {
                                locale
                                value
                            }
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, {
            slug: categories[0].model.slug.value()
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.getCategory).toMatchObject({
            data: {
                id: get(categories[0].data, "id"),
                title: get(categories[0].data, "fields.title"),
                slug: get(categories[0].data, "fields.slug")
            }
        });
    });

    test(`list categories (no parameters)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories {
                    data {
                        id
                        title {
                            values {
                                locale
                                value
                            }
                        }
                        slug {
                            values {
                                locale
                                value
                            }
                        }
                    }
                    error {
                        message
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context);

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.listCategories).toMatchObject({
            data: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                locale: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                                value: expect.stringMatching(
                                    /^A Category EN|B Category EN|Hardware EN$/
                                )
                            })
                        ])
                    }),
                    slug: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                locale: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                                value: expect.stringMatching(
                                    /^a-category-en|b-category-en|hardware-en$/
                                )
                            })
                        ])
                    })
                })
            ])
        });
    });

    test(`list entries (limit)`, async () => {
        const query = /* GraphQL */ `
            {
                listCategories(limit: 1) {
                    data {
                        id
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context);
        expect(data.listCategories).toMatchObject({
            data: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.stringMatching(/^[0-9a-fA-F]{24}$/)
                })
            ])
        });
        expect(data.listCategories.data.length).toBe(1);
    });

    test(`list categories (sort ASC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title {
                            values {
                                value
                            }
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, {
            sort: ["slug_ASC"]
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.listCategories).toMatchObject({
            data: [
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "A Category EN"
                            })
                        ])
                    })
                },
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "B Category EN"
                            })
                        ])
                    })
                },
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "Hardware EN"
                            })
                        ])
                    })
                }
            ]
        });
    });

    test(`list categories (sort DESC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title {
                            values {
                                value
                            }
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, {
            sort: ["slug_DESC"]
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.listCategories).toMatchObject({
            data: [
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "Hardware EN"
                            })
                        ])
                    })
                },
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "B Category EN"
                            })
                        ])
                    })
                },
                {
                    title: expect.objectContaining({
                        values: expect.arrayContaining([
                            expect.objectContaining({
                                value: "A Category EN"
                            })
                        ])
                    })
                }
            ]
        });
    });

    test(`list categories (contains, not_contains, in, not_in)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($where: CategoryListWhereInput) {
                listCategories(where: $where) {
                    data {
                        title {
                            values {
                                value
                            }
                        }
                    }
                    error {
                        message
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data: data1, errors: errors1 } = await graphql(schema, query, {}, context, {
            where: { slug_contains: "category" }
        });

        if (errors1) {
            throw Error(JSON.stringify(errors1, null, 2));
        }

        expect(data1.listCategories.data.length).toBe(2);

        const { data: data2, errors: errors2 } = await graphql(schema, query, {}, context, {
            where: { slug_not_contains: "category" }
        });

        if (errors2) {
            throw Error(JSON.stringify(errors2, null, 2));
        }

        expect(data2.listCategories.data.length).toBe(1);

        const { data: data3, errors: errors3 } = await graphql(schema, query, {}, context, {
            where: { slug_in: ["b-category-en"] }
        });

        if (errors3) {
            throw Error(JSON.stringify(errors3, null, 2));
        }

        expect(data3.listCategories.data.length).toBe(1);

        const { data: data4, errors: errors4 } = await graphql(schema, query, {}, context, {
            where: {
                slug_not_in: ["a-category-en", "a-category-de", "b-category-en", "b-category-de"]
            }
        });

        if (errors4) {
            throw Error(JSON.stringify(errors4, null, 2));
        }

        expect(data4.listCategories.data.length).toBe(1);
        expect(data4.listCategories.data[0].title.values[0].value).toBe("Hardware EN");
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

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, {
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
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.createCategory).toMatchObject({
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

        const { schema, context } = await useSchema();
        const { data: data1, errors: errors1 } = await graphql(schema, query, {}, context, {
            where: {
                slug: categories[0].model.slug.value()
            },
            data: {
                title: {
                    values: [
                        { locale: locales.en.id, value: "Software EN" },
                        { locale: locales.de.id, value: "Software DE" }
                    ]
                }
            }
        });

        if (errors1) {
            throw Error(JSON.stringify(errors1, null, 2));
        }

        expect(data1.updateCategory).toMatchObject({
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

        const { data: data2, errors: errors2 } = await graphql(schema, query, {}, context, {
            where: {
                id: data1.updateCategory.data.id
            },
            data: {
                title: {
                    values: [
                        { locale: locales.en.id, value: "Random EN" },
                        { locale: locales.de.id, value: "Random DE" }
                    ]
                }
            }
        });

        if (errors2) {
            throw Error(JSON.stringify(errors2, null, 2));
        }

        expect(data2.updateCategory).toMatchObject({
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
        const query = /* GraphQL */ `
            mutation DeleteCategory($where: CategoryDeleteWhereInput!) {
                deleteCategory(where: $where) {
                    data
                }
            }
        `;

        const { schema, context } = await useSchema();

        expect(await context.models.category.count()).toBe(3);

        const { data, errors } = await graphql(schema, query, {}, context, {
            where: {
                slug: "hardware-en"
            }
        });

        if (errors) {
            throw Error(JSON.stringify(errors, null, 2));
        }

        expect(data.deleteCategory).toMatchObject({
            data: true
        });

        const countCategories = await context.models.category.count();
        expect(countCategories).toBe(2);
    });
});
