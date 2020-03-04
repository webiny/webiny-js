import { graphql } from "graphql";
import { locales } from "../../mocks/mockI18NLocales";
import createCategories from "../data/createCategories";

export default ({ setupSchema }) => {
    describe("cmsManage resolvers", () => {
        let categories;
        let Category;

        beforeEach(async () => {
            const { context } = await setupSchema();
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
                    cmsManage {
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
                }
            `;

            const { schema, context } = await setupSchema();
            const { data, errors } = await graphql(schema, query, {}, context, {
                id: categories[0].model.id
            });

            if (errors) {
                throw Error(JSON.stringify(errors, null, 2));
            }

            expect(data.cmsManage.getCategory).toMatchObject({
                data: categories[0].data
            });
        });

        test(`get category by slug`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($slug: String) {
                    cmsManage {
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
                }
            `;

            const { schema, context } = await setupSchema();
            const { data, errors } = await graphql(schema, query, {}, context, {
                slug: categories[0].model.slug.value()
            });

            if (errors) {
                throw Error(JSON.stringify(errors, null, 2));
            }

            expect(data.cmsManage.getCategory).toMatchObject({
                data: categories[0].data
            });
        });

        test(`create category`, async () => {
            const query = /* GraphQL */ `
                mutation CreateCategory($data: CmsManageCategoryInput!) {
                    cmsManage {
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
                }
            `;

            const { schema, context } = await setupSchema();
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

            expect(data.cmsManage.createCategory).toMatchObject({
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
                mutation UpdateCategory(
                    $where: CmsManageCategoryUpdateWhereInput!
                    $data: CmsManageCategoryInput!
                ) {
                    cmsManage {
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
                }
            `;

            const { schema, context } = await setupSchema();
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

            expect(data1.cmsManage.updateCategory).toMatchObject({
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
                    id: data1.cmsManage.updateCategory.data.id
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

            expect(data2.cmsManage.updateCategory).toMatchObject({
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
                mutation DeleteCategory($where: CmsManageCategoryDeleteWhereInput!) {
                    cmsManage {
                        deleteCategory(where: $where) {
                            data
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();

            expect(await context.models.category.count()).toBe(3);

            const { data, errors } = await graphql(schema, query, {}, context, {
                where: {
                    slug: "hardware-en"
                }
            });

            if (errors) {
                throw Error(JSON.stringify(errors, null, 2));
            }

            expect(data.cmsManage.deleteCategory).toMatchObject({
                data: true
            });

            const countCategories = await context.models.category.count();
            expect(countCategories).toBe(2);
        });
    });
};
