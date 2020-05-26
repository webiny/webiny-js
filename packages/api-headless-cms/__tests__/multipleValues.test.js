import mdbid from "mdbid";
import useCmsHandler from "./utils/useCmsHandler";
import { locales } from "./mocks/I18NLocales";

describe("Multiple Values Test", () => {
    const { database, environment } = useCmsHandler();
    const ids = { environment: mdbid(), contentModelGroup: mdbid() };

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        await database.collection("CmsEnvironment").insert({
            id: ids.environment,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });

        await database.collection("CmsContentModelGroup").insert({
            id: ids.contentModelGroup,
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: "fas/star",
            environment: ids.environment
        });
    });

    it("should update search catalog accordingly", async () => {
        const { content, createContentModel } = environment(ids.environment);

        const contentModel = await createContentModel({
            data: {
                name: "Product",
                group: ids.contentModelGroup,
                fields: [
                    {
                        _id: "vqk-UApan",
                        fieldId: "title",
                        multipleValues: true,
                        label: {
                            values: [
                                {
                                    locale: locales.en.id,
                                    value: "Tags"
                                },
                                {
                                    locale: locales.de.id,
                                    value: "Stichworte"
                                }
                            ]
                        },
                        type: "text"
                    }
                ]
            }
        });

        expect(contentModel.fields[0].multipleValues).toBe(true);

        // 2. Create a new product entry.
        const products = await content("product");

        let productRev1 = await products.create({
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Pen"
                        },
                        {
                            locale: locales.de.id,
                            value: "Kugelschreiber"
                        }
                    ]
                }
            }
        });
    });
});
