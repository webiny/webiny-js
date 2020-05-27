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

    it("should be able to create and populate multiple-values fields", async () => {
        const { content, createContentModel } = environment(ids.environment);

        const contentModel = await createContentModel({
            data: {
                name: "Product",
                group: ids.contentModelGroup,
                fields: [
                    {
                        _id: "vqk-UApan",
                        fieldId: "title",
                        label: {
                            values: [
                                {
                                    locale: locales.en.id,
                                    value: "Title"
                                },
                                {
                                    locale: locales.de.id,
                                    value: "Titel"
                                }
                            ]
                        },
                        type: "text"
                    },
                    {
                        _id: "vqk-UApan",
                        fieldId: "tags",
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

        expect(contentModel.fields[0].multipleValues).toBe(false);
        expect(contentModel.fields[1].multipleValues).toBe(true);

        // 2. Create a new product entry.
        const products = await content("product");

        const product = await products.create({
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Test Pen"
                        },
                        {
                            locale: locales.de.id,
                            value: "Test Kugelschreiber"
                        }
                    ]
                },
                tags: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: ["Pen", "Pencil", "Eraser", "Sharpener"]
                        },
                        {
                            locale: locales.de.id,
                            value: ["Kugelschreiber", "Bleistift"]
                        }
                    ]
                }
            }
        });

        expect(product).toEqual({
            id: product.id,
            title: {
                values: [
                    {
                        value: "Test Pen",
                        locale: locales.en.id
                    },
                    {
                        value: "Test Kugelschreiber",
                        locale: locales.de.id
                    }
                ]
            },
            tags: {
                values: [
                    {
                        value: ["Pen", "Pencil", "Eraser", "Sharpener"],
                        locale: locales.en.id
                    },
                    {
                        value: ["Kugelschreiber", "Bleistift"],
                        locale: locales.de.id
                    }
                ]
            }
        });
    });
});
