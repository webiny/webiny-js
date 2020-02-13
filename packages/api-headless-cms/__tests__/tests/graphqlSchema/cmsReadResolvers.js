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
                    }
                })
                .save();

            targetResult = {
                data: {
                    id: category.id,
                    title: "Hardware EN"
                }
            };
        });

        test(`get category by ID`, async () => {
            // Test resolvers
            const query = /* GraphQL */ `
                query GetCategory($id: ID!) {
                    cmsRead {
                        getCategory(where: { id: $id }) {
                            data {
                                id
                                title
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
    });
};
