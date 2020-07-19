import useContentHandler from "./../utils/useContentHandler";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import { Database } from "@commodo/fields-storage-nedb";
import contentModels from "./../mocks/genericContentModels/contentModels";
import createCategories from "./../mocks/genericContentModels/categories.read";

describe("READ - Resolvers", () => {
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });

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

    test(`get entry by ID`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.read({ where: { id: initial.categories[0].id } });

        expect(data).toEqual({
            id: initial.categories[0].id,
            title: "Hardware EN",
            slug: "hardware-en"
        });
    });

    test(`get entry by slug (default locale matches slug)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.read({ where: { slug: "hardware-en" } });

        expect(data).toEqual({
            id: initial.categories[0].id,
            title: "Hardware EN",
            slug: "hardware-en"
        });
    });

    test(`get entry by slug (from unpublished revision - should fail)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");

        let error;

        try {
            await categories.read({ where: { slug: "framework-en" } });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe("Entry not found!");
    });

    test(`get entry by slug (default locale doesn't match slug)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");

        let error;

        try {
            await categories.read({ where: { slug: "hardware-de" } });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe("Entry not found!");
    });

    test(`get entry by slug (specific locale)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.read({ locale: "de-DE", where: { slug: "hardware-de" } });

        expect(data).toEqual({
            id: initial.categories[0].id,
            title: "Hardware DE",
            slug: "hardware-de"
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

        const { invoke } = environmentRead(initial.environment.id);
        const [body] = await invoke({ body: { query, variables: { slug: "hardware-en" } } });

        expect(body.data.getCategory).toEqual({
            data: {
                id: initial.categories[0].id,
                title: "Hardware EN",
                deTitle: "Hardware DE",
                enSlug: "hardware-en",
                deSlug: "hardware-de"
            }
        });
    });

    test(`list entries (no parameters)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list();

        expect(data).toEqual([
            {
                id: initial.categories[2].id,
                savedOn: data[0].savedOn,
                slug: "b-category-en",
                title: "B Category EN"
            },
            {
                id: initial.categories[1].id,
                savedOn: data[1].savedOn,
                slug: "a-category-en",
                title: "A Category EN"
            },
            {
                id: initial.categories[0].id,
                savedOn: data[2].savedOn,
                slug: "hardware-en",
                title: "Hardware EN"
            }
        ]);
    });

    test(`list entries (specific locale)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list({ locale: "de-DE" });

        expect(data).toEqual([
            {
                id: initial.categories[2].id,
                savedOn: data[0].savedOn,
                slug: "b-category-de",
                title: "B Category DE"
            },
            {
                id: initial.categories[1].id,
                savedOn: data[1].savedOn,
                slug: "a-category-de",
                title: "A Category DE"
            },
            {
                id: initial.categories[0].id,
                savedOn: data[2].savedOn,
                slug: "hardware-de",
                title: "Hardware DE"
            }
        ]);
    });

    test(`list entries (limit)`, async () => {
        const { content } = environmentRead(initial.environment.id);
        const categories = await content("category");
        const data = await categories.list({ limit: 1 });

        expect(data).toEqual([
            {
                id: initial.categories[2].id,
                savedOn: data[0].savedOn,
                slug: "b-category-en",
                title: "B Category EN"
            }
        ]);
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

        const { invoke } = environmentRead(initial.environment.id);
        const [body1] = await invoke({ body: { query } });

        expect(body1.data.listCategories).toMatchObject({
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

        const [body2] = await invoke({
            body: { query, variables: { after: body1.data.listCategories.meta.cursors.next } }
        });

        expect(body2.data.listCategories).toMatchObject({
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

        const { invoke } = environmentRead(initial.environment.id);
        const [body] = await invoke({ body: { query, variables: { sort: ["slug_ASC"] } } });

        expect(body.data.listCategories).toMatchObject({
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

        const { invoke } = environmentRead(initial.environment.id);
        const [body] = await invoke({ body: { query, variables: { sort: ["slug_DESC"] } } });

        expect(body.data.listCategories).toMatchObject({
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

        const { invoke } = environmentRead(initial.environment.id);
        const [body1] = await invoke({
            body: { query, variables: { where: { slug_contains: "category" } } }
        });

        expect(body1.data.listCategories.data.length).toBe(2);

        // TODO: cannot write this query in neDB (throws an error).
        // TODO: @see packages/api-headless-cms/src/content/plugins/filterOperators/operatorNotContains.ts
        /*const [body2] = await invoke({
            body: { query, variables: { where: { slug_not_contains: "category" } } }
        });

        expect(body2.data.listCategories.data.length).toBe(1);*/

        const [body3] = await invoke({
            body: { query, variables: { where: { slug_in: ["b-category-en"] } } }
        });

        expect(body3.data.listCategories.data.length).toBe(1);


        const [body4] = await invoke({
            body: { query, variables: { where: { slug_not_in: ["a-category-en", "b-category-en"] } } }
        });

        expect(body4.data.listCategories.data.length).toBe(1);
        expect(body4.data.listCategories.data[0].title).toBe("Hardware EN");
    });
});
