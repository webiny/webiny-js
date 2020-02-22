import { blue } from "chalk";
import { setupContext } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import { locales } from "../mocks/mockI18NLocales";
import { createDataModelFromData } from "../../src/plugins/utils/createDataModelFromData";
import headlessPlugins from "../../src/plugins";

export default ({ plugins }) => {
    describe(`Utilities`, () => {
        let context;

        beforeAll(async () => {
            // Setup context
            context = await setupContext([plugins, ...headlessPlugins()], {
                event: { headers: { "accept-language": "en-US" } }
            });
        });

        describe(`"createModelFromData"`, () => {
            test("data is converted to commodo model", async () => {
                // Create content models
                for (let i = 0; i < contentModels.length; i++) {
                    const modelData = contentModels[i];
                    context.models[modelData.model] = createDataModelFromData(
                        context.models.createBase(),
                        modelData,
                        context
                    );
                }

                // Test instantiation and presence of fields
                for (let i = 0; i < contentModels.length; i++) {
                    const Model = context.models[contentModels[i].modelId];
                    const instance = new Model();
                    expect(instance).toBeInstanceOf(Model);

                    for (let j = 0; j < contentModels[i].fields.length; j++) {
                        const field = contentModels[i].fields[j];
                        expect(instance.getField(field.fieldId)).toBeTruthy();
                    }
                }

                // Test Category
                const Category = context.models["category"];
                const category = new Category();
                category.populate({
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
                });

                await category.save();

                expect(category.id).toMatch(/^[0-9a-fA-F]{24}$/);
                expect(category.title).toMatchObject({
                    values: [
                        { locale: locales.en.id, value: "Hardware EN" },
                        { locale: locales.de.id, value: "Hardware DE" }
                    ]
                });
                expect(category.title.value()).toBe("Hardware EN");

                // Test CategorySearch
                const CategorySearch = context.models["categorySearch"];
                const cSearch = await CategorySearch.find({
                    query: { model: "category", instance: category.id }
                });
                expect(cSearch.length).toBe(3);
                expect(cSearch.find(s => s.locale === locales.en.id).title).toBe("Hardware EN");

                // Test Product
                const Product = context.models["product"];
                const product = new Product();
                product.populate({
                    title: {
                        values: [
                            { locale: locales.en.id, value: "Laptop EN" },
                            { locale: locales.de.id, value: "Laptop DE" }
                        ]
                    },
                    category: {
                        values: [{ locale: locales.en.id, value: category }]
                    },
                    price: {
                        values: [
                            { locale: locales.en.id, value: 100.0 },
                            { locale: locales.de.id, value: 87.0 }
                        ]
                    },
                    inStock: {
                        values: [
                            { locale: locales.en.id, value: true },
                            { locale: locales.de.id, value: false }
                        ]
                    },
                    itemsInStock: {
                        values: [
                            { locale: locales.en.id, value: 20 },
                            { locale: locales.de.id, value: 45 }
                        ]
                    },
                    availableOn: {
                        values: [
                            { locale: locales.en.id, value: "2020-04-16" },
                            { locale: locales.de.id, value: "2020-04-17" }
                        ]
                    }
                });

                try {
                    await product.save();
                } catch (e) {
                    console.log(e.data.invalidFields);
                    throw e;
                }

                expect(product.id).toMatch(/^[0-9a-fA-F]{24}$/);
                expect(product.title).toMatchObject({
                    values: [
                        { locale: locales.en.id, value: "Laptop EN" },
                        { locale: locales.de.id, value: "Laptop DE" }
                    ]
                });
                expect(product.title.value()).toBe("Laptop EN");
                expect(product.price.value()).toBe(100.0);

                const productCategory = await product.category.value();
                expect(productCategory.id).toBe(category.id);
                expect(productCategory.title.value()).toBe("Hardware EN");

                // Test Review
                const Review = context.models["review"];
                const review = new Review();
                review.populate({
                    text: {
                        values: [{ locale: locales.en.id, value: "An average product" }]
                    },
                    rating: {
                        values: [{ locale: locales.en.id, value: 4.5 }]
                    },
                    product: {
                        values: [{ locale: locales.en.id, value: product.id }]
                    }
                });

                await review.save();

                expect(review.text.value()).toBe("An average product");
                expect(review.rating.value()).toBe(4.5);
                expect((await review.product.value()).id).toBe(product.id);
            });
        });
    });

    describe("Model fields", () => {
        let context;
        let instance;

        function createValue(value) {
            return { values: [{ locale: locales.en.id, value }] };
        }

        beforeAll(async () => {
            // Setup context
            context = await setupContext([plugins, ...headlessPlugins()], {
                event: { headers: { "accept-language": "en-US" } }
            });
        });

        beforeEach(() => {
            const datetime = context.plugins
                .byType("cms-model-field-to-commodo-field")
                .find(pl => pl.fieldType === "datetime");

            const model = context.models.createBase();

            datetime.dataModel({
                model,
                field: {
                    fieldId: "dateTimeWithTimezone",
                    type: "datetime",
                    settings: { type: "dateTimeWithTimezone" }
                },
                context
            });

            datetime.dataModel({
                model,
                field: {
                    fieldId: "dateTimeWithoutTimezone",
                    type: "datetime",
                    settings: { type: "dateTimeWithoutTimezone" }
                },
                context
            });

            datetime.dataModel({
                model,
                field: {
                    fieldId: "date",
                    type: "datetime",
                    settings: { type: "date" }
                },
                context
            });

            datetime.dataModel({
                model,
                field: {
                    fieldId: "time",
                    type: "datetime",
                    settings: { type: "time" }
                },
                context
            });

            instance = new model();
        });

        describe(`"datetime": ${blue("dateTimeWithTimezone")}`, () => {
            const field = "dateTimeWithTimezone";

            test(`Date object should pass`, () => {
                expect(() => instance.populate({ [field]: createValue(new Date()) })).not.toThrow();
            });

            test(`"random string" should fail`, () => {
                expect(() =>
                    instance.populate({ [field]: createValue("random string") })
                ).toThrow();
            });

            test(`"2020-05-04T12:35:17Z" should pass`, () => {
                expect(() => instance.populate({ [field]: createValue("2020-05-04T12:35:17Z") }))
                    .resolves;
            });
        });

        describe(`"datetime": ${blue("dateTimeWithoutTimezone")}`, () => {
            const field = "dateTimeWithoutTimezone";

            test(`"2020-05-04 12:35:17" should pass`, async () => {
                instance.populate({ [field]: createValue("2020-05-04 12:35:17") });
                await expect(instance.getField(field).validate()).resolves;
            });

            test(`"2020-15-04 12:35:17" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-15-04 12:35:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"2020-15-04 56:35:17" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-15-04 56:35:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"2020-15-04" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-15-04") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"12:35:17" should fail`, async () => {
                instance.populate({ [field]: createValue("12:35:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });
        });

        describe(`"datetime": ${blue("date")}`, () => {
            const field = "date";

            test(`"2020-11-04" should pass`, async () => {
                instance.populate({ [field]: createValue("2020-11-04") });
                await expect(instance.getField(field).validate()).resolves;
            });

            test(`"2020-15-04" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-15-04") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"2020-15-04 12:45:25" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-15-04 12:45:25") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"12:35:17" should fail`, async () => {
                instance.populate({ [field]: createValue("12:35:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });
        });

        describe(`"datetime": ${blue("time")}`, () => {
            const field = "time";

            test(`"12:35:17" should pass`, async () => {
                instance.populate({ [field]: createValue("12:35:17") });
                await expect(instance.getField(field).validate()).resolves;
            });
            test(`"25:35:17" should fail`, async () => {
                instance.populate({ [field]: createValue("25:35:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"12:67:17" should fail`, async () => {
                instance.populate({ [field]: createValue("12:67:17") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"12:27:67" should fail`, async () => {
                instance.populate({ [field]: createValue("12:27:67") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });

            test(`"2020-12-04 12:45:25" should fail`, async () => {
                instance.populate({ [field]: createValue("2020-12-04 12:45:25") });
                await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
            });
        });
    });
};
