import { graphql } from "graphql";
import { locales } from "../../mocks/mockI18NLocales";

export default ({ setupSchema }) => {
    describe("cmsManage resolvers", () => {
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
                            { locale: locales.en.id, value: "Hardware EN" },
                            { locale: locales.de.id, value: "Hardware DE" }
                        ],
                        enValue: "Hardware EN",
                        deValue: "Hardware DE"
                    },
                    slug: {
                        values: [
                            { locale: locales.en.id, value: "hardware-en" },
                            { locale: locales.de.id, value: "hardware-de" }
                        ],
                        enValue: "hardware-en",
                        deValue: "hardware-de"
                    }
                }
            });
        });

        test(`update category (by ID, by slug)`, async () => {
            const query = /* GraphQL */ `
                mutation UpdateCategory($where: CmsManageCategoryUpdateWhereInput!, $data: CmsManageCategoryInput!) {
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
                        }
                    }
                }
            `;

            const { schema, context } = await setupSchema();
            const { data: data1, errors: errors1 } = await graphql(schema, query, {}, context, {
                where: {
                    slug: "hardware-en"
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
                            { locale: locales.en.id, value: "Hardware EN" },
                            { locale: locales.de.id, value: "Hardware DE" }
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
                            { locale: locales.en.id, value: "Hardware EN" },
                            { locale: locales.de.id, value: "Hardware DE" }
                        ],
                        enValue: "Hardware EN",
                        deValue: "Hardware DE"
                    }
                }
            });
        });
    });
};
