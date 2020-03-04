import { graphql } from "graphql";
import createCategories from "../data/createCategories";

export default ({ setupSchema }) => {
    describe("cmsRead resolvers", () => {
        let categories;
        let targetResult;
        let Category;

        beforeEach(async () => {
            // Insert demo data via models
            const { context } = await setupSchema();

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

        test(`get category by ID`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($id: ID) {
                    cmsRead {
                        getCategory(where: { id: $id }) {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                id: categories[0].model.id
            });
            expect(data.cmsRead.getCategory).toMatchObject(targetResult);
        });

        test(`get category by slug (default locale matches slug)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    cmsRead {
                        getCategory(where: { slug: $slug }) {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-en"
            });

            expect(data.cmsRead.getCategory).toMatchObject(targetResult);
        });

        test(`get category by slug (default locale doesn't match slug)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    cmsRead {
                        getCategory(where: { slug: $slug }) {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-de"
            });

            expect(data.cmsRead.getCategory.data).toBe(null);
        });

        test(`get category by slug (specific locale)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($locale: String, $slug: String) {
                    cmsRead {
                        getCategory(locale: $locale, where: { slug: $slug }) {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-de",
                locale: "de-DE"
            });

            expect(data.cmsRead.getCategory).toMatchObject({
                data: {
                    id: categories[0].model.id,
                    title: "Hardware DE",
                    slug: "hardware-de"
                }
            });
        });

        test(`get category by slug with field locale override`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    cmsRead {
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
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                slug: "hardware-en"
            });

            expect(data.cmsRead.getCategory).toMatchObject({
                data: {
                    id: categories[0].model.id,
                    title: "Hardware EN",
                    deTitle: "Hardware DE",
                    enSlug: "hardware-en",
                    deSlug: "hardware-de"
                }
            });
        });

        test(`list categories (no parameters)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    cmsRead {
                        listCategories {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.cmsRead.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                        title: expect.stringMatching(/^A Category EN|B Category EN|Hardware EN$/),
                        slug: expect.stringMatching(/^a-category-en|b-category-en|hardware-en$/)
                    })
                ])
            });
        });

        test(`list categories (specific locale)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    cmsRead {
                        listCategories(locale: "de-DE") {
                            data {
                                id
                                title
                                slug
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.cmsRead.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
                        title: expect.stringMatching(/^A Category DE|B Category DE|Hardware DE$/),
                        slug: expect.stringMatching(/^a-category-de|b-category-de|hardware-de/)
                    })
                ])
            });
        });

        test(`list categories (perPage)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                {
                    cmsRead {
                        listCategories(perPage: 1) {
                            data {
                                id
                            }
                            meta {
                                totalCount
                                totalPages
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context);
            expect(data.cmsRead.listCategories).toMatchObject({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/)
                    })
                ]),
                meta: {
                    totalCount: 3,
                    totalPages: 3
                }
            });
        });

        test(`list categories (page)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($page: Int) {
                    cmsRead {
                        listCategories(page: $page, perPage: 1) {
                            data {
                                title
                            }
                            meta {
                                nextPage
                                previousPage
                                totalCount
                                totalPages
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data: data1 } = await graphql(schema, query, {}, context, { page: 2 });

            expect(data1.cmsRead.listCategories).toMatchObject({
                data: [
                    {
                        title: "A Category EN"
                    }
                ],
                meta: {
                    nextPage: 3,
                    previousPage: 1,
                    totalCount: 3,
                    totalPages: 3
                }
            });

            const { data: data2 } = await graphql(schema, query, {}, context, { page: 3 });
            expect(data2.cmsRead.listCategories).toMatchObject({
                data: [
                    {
                        title: "Hardware EN"
                    }
                ],
                meta: {
                    nextPage: null,
                    previousPage: 2,
                    totalCount: 3,
                    totalPages: 3
                }
            });
        });

        test(`list categories (sort ASC)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($sort: [CmsReadCategoryListSorter]) {
                    cmsRead {
                        listCategories(sort: $sort) {
                            data {
                                title
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                sort: ["title_ASC"]
            });
            expect(data.cmsRead.listCategories).toMatchObject({
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

        test(`list categories (sort DESC)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($sort: [CmsReadCategoryListSorter]) {
                    cmsRead {
                        listCategories(sort: $sort) {
                            data {
                                title
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data } = await graphql(schema, query, {}, context, {
                sort: ["title_DESC"]
            });
            expect(data.cmsRead.listCategories).toMatchObject({
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

        test(`list categories (contains, not_contains, in, not_in)`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query ListCategories($where: CmsReadCategoryListWhereInput) {
                    cmsRead {
                        listCategories(where: $where) {
                            data {
                                title
                            }
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data: data1 } = await graphql(schema, query, {}, context, {
                where: { title_contains: "category" }
            });
            expect(data1.cmsRead.listCategories.data.length).toBe(2);

            const { data: data2 } = await graphql(schema, query, {}, context, {
                where: { title_not_contains: "category" }
            });
            expect(data2.cmsRead.listCategories.data.length).toBe(1);

            const { data: data3 } = await graphql(schema, query, {}, context, {
                where: { title_in: ["B Category EN"] }
            });
            expect(data3.cmsRead.listCategories.data.length).toBe(1);

            const { data: data4 } = await graphql(schema, query, {}, context, {
                where: { title_not_in: ["A Category EN", "B Category EN"] }
            });
            expect(data4.cmsRead.listCategories.data.length).toBe(1);
            expect(data4.cmsRead.listCategories.data[0].title).toBe("Hardware EN");
        });
    });
};
