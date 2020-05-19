import { graphql } from "graphql";
import setupContentModels from "../setup/setupContentModels";
import { createUtils } from "../utils";
import createCategories from "../mocks/createCategories.read";
import headlessPlugins from "../../src/handler/plugins";
import setupDefaultEnvironment from "../setup/setupDefaultEnvironment";

describe("READ - Resolvers", () => {
    let Category;
    let categories;
    let targetResult;

    const { useSchema, useDatabase, useContext } = createUtils([
        headlessPlugins({ type: "read", environment: "production" })
    ]);

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);
        const context = await useContext();
        await setupContentModels(context);
    });

    beforeEach(async () => {
        // Insert demo data via models
        const context = await useContext();

        Category = context.models.category;

        categories = await createCategories(context);

        targetResult = {
            data: {
                id: categories[0].model.id,
                title: categories[0].model.title.value(),
                slug: categories[0].model.slug.value()
            }
        };
    });

    afterEach(async () => {
        const entries = await Category.find();
        for (let i = 0; i < entries.length; i++) {
            await entries[i].delete();
        }
    });

    test(`get entry by ID`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($id: ID) {
                getCategory(where: { id: $id }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                        message
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

        expect(data.getCategory).toMatchObject(targetResult);
    });

    test(`get entry by slug (default locale matches slug)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            slug: "hardware-en"
        });

        expect(data.getCategory).toMatchObject(targetResult);
    });

    test(`get entry by slug (from unpublished revision - should fail)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            slug: "framework-en"
        });

        expect(data.getCategory.data).toBeNull();
        expect(data.getCategory.error.code).toBe("NOT_FOUND");
    });

    test(`get entry by slug (default locale doesn't match slug)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            slug: "hardware-de"
        });

        expect(data.getCategory.data).toBe(null);
    });

    test(`get entry by slug (specific locale)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($locale: String, $slug: String) {
                getCategory(locale: $locale, where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            slug: "hardware-de",
            locale: "de-DE"
        });

        expect(data.getCategory).toMatchObject({
            data: {
                id: categories[0].model.id,
                title: "Hardware DE",
                slug: "hardware-de"
            }
        });
    });

    test(`get entry by slug with field locale override`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        deTitle: title(locale: "de-DE")
                        enSlug: slug
                        deSlug: slug(locale: "de-DE")
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            slug: "hardware-en"
        });

        expect(data.getCategory).toMatchObject({
            data: {
                id: categories[0].model.id,
                title: "Hardware EN",
                deTitle: "Hardware DE",
                enSlug: "hardware-en",
                deSlug: "hardware-de"
            }
        });
    });

    test(`list entries (no parameters)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context);
        expect(data.listCategories).toMatchObject({
            data: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                    title: expect.stringMatching(/^A Category EN|B Category EN|Hardware EN$/),
                    slug: expect.stringMatching(/^a-category-en|b-category-en|hardware-en$/)
                })
            ])
        });
    });

    test(`list entries (specific locale)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories(locale: "de-DE") {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context);
        expect(data.listCategories).toMatchObject({
            data: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                    title: expect.stringMatching(/^A Category DE|B Category DE|Hardware DE$/),
                    slug: expect.stringMatching(/^a-category-de|b-category-de|hardware-de/)
                })
            ])
        });
    });

    test(`list entries (limit)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            {
                listCategories(limit: 1) {
                    data {
                        id
                    }
                    meta {
                        totalCount
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
            ]),
            meta: {
                totalCount: 3
            }
        });
    });

    test(`list entries (limit + after)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($after: String) {
                listCategories(after: $after, limit: 1) {
                    data {
                        title
                    }
                    meta {
                        cursors {
                            next
                            previous
                        }
                        totalCount
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data: data1, errors: errors1 } = await graphql(schema, query, {}, context);

        if (errors1) {
            throw Error(JSON.stringify(errors1, null, 2));
        }

        expect(data1.listCategories).toMatchObject({
            data: [
                {
                    title: "B Category EN"
                }
            ],
            meta: {
                cursors: {
                    next: expect.any(String),
                    previous: null
                },
                totalCount: 3
            }
        });

        const { data: data2, errors: errors2 } = await graphql(schema, query, {}, context, {
            after: data1.listCategories.meta.cursors.next
        });

        if (errors2) {
            throw Error(JSON.stringify(errors2, null, 2));
        }

        expect(data2.listCategories).toMatchObject({
            data: [
                {
                    title: "A Category EN"
                }
            ],
            meta: {
                cursors: {
                    next: expect.any(String),
                    previous: expect.any(String)
                },
                totalCount: 3
            }
        });
    });

    test(`list entries (sort ASC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            sort: ["slug_ASC"]
        });
        expect(data.listCategories).toMatchObject({
            data: [
                {
                    title: "A Category EN"
                },
                {
                    title: "B Category EN"
                },
                {
                    title: "Hardware EN"
                }
            ]
        });
    });

    test(`list entries (sort DESC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data } = await graphql(schema, query, {}, context, {
            sort: ["slug_DESC"]
        });
        expect(data.listCategories).toMatchObject({
            data: [
                {
                    title: "Hardware EN"
                },
                {
                    title: "B Category EN"
                },
                {
                    title: "A Category EN"
                }
            ]
        });
    });

    test(`list entries (contains, not_contains, in, not_in)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($where: CategoryListWhereInput) {
                listCategories(where: $where) {
                    data {
                        title
                    }
                    error {
                        message
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data: data1 } = await graphql(schema, query, {}, context, {
            where: { slug_contains: "category" }
        });
        expect(data1.listCategories.data.length).toBe(2);

        const { data: data2 } = await graphql(schema, query, {}, context, {
            where: { slug_not_contains: "category" }
        });

        expect(data2.listCategories.data.length).toBe(1);

        const { data: data3 } = await graphql(schema, query, {}, context, {
            where: { slug_in: ["b-category-en"] }
        });
        expect(data3.listCategories.data.length).toBe(1);

        const { data: data4 } = await graphql(schema, query, {}, context, {
            where: { slug_not_in: ["a-category-en", "b-category-en"] }
        });
        expect(data4.listCategories.data.length).toBe(1);
        expect(data4.listCategories.data[0].title).toBe("Hardware EN");
    });
});
