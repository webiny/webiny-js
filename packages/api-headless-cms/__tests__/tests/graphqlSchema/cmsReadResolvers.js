import { graphql } from "graphql";
import { locales } from "../../mocks/mockI18NLocales";

export default ({ setupSchema }) => {
    describe("cmsRead resolvers", () => {
        let category;
        let targetResult;

        beforeAll(async () => {
            // Insert demo data via models
            const { context } = await setupSchema();

            const Category = context.models["category"];
            category = new Category();

            await category
                .populate({
                    title: {
                        values: [
                            { locale: locales.en.id, value: "Hardware EN" },
                            { locale: locales.de.id, value: "Hardware DE" }
                        ]
                    },
                    slug: {
                        values: [
                            { locale: locales.en.id, value: "hardware-en" },
                            { locale: locales.de.id, value: "hardware-de" }
                        ]
                    }
                })
                .save();

            targetResult = {
                data: {
                    id: category.id,
                    title: "Hardware EN",
                    slug: "hardware-en"
                }
            };
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
                id: category.id
            });
            expect(data.cmsRead.getCategory).toMatchObject(targetResult);
        });

        test(`get category by slug (default locale matches slug language)`, async () => {
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

        test(`get category by slug (default locale)`, async () => {
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
                    id: category.id,
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
                    id: category.id,
                    title: "Hardware EN",
                    deTitle: "Hardware DE",
                    enSlug: "hardware-en",
                    deSlug: "hardware-de"
                }
            });
        });
    });
};
