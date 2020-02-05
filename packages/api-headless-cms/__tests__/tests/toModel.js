import { blue } from "chalk";
import { setupContext } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import { locales } from "../mocks/mockI18NLocales";
import { createModelFromData } from "../../src/plugins/utils/createModelFromData";
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
                    context.models[modelData.modelId] = createModelFromData(
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
                expect(category.title.value).toBe("Hardware EN");

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
                            { locale: locales.en.id, value: 100 },
                            { locale: locales.de.id, value: 87 }
                        ]
                    },
                    availableOn: {
                        values: [
                            { locale: locales.en.id, value: "2020-04-16" },
                            { locale: locales.de.id, value: "2020-04-17" }
                        ]
                    }
                });

                await product.save();

                expect(product.id).toMatch(/^[0-9a-fA-F]{24}$/);
                expect(product.title).toMatchObject({
                    values: [
                        { locale: locales.en.id, value: "Laptop EN" },
                        { locale: locales.de.id, value: "Laptop DE" }
                    ]
                });
                expect(product.title.value).toBe("Laptop EN");
                expect(product.price.value).toBe(100);

                const productCategory = await product.category.value;
                expect(productCategory.id).toBe(category.id);
                expect(productCategory.title.value).toBe("Hardware EN");
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

            datetime.apply({
                model,
                field: {
                    fieldId: "dateTimeWithTimezone",
                    type: "datetime",
                    settings: { type: "dateTimeWithTimezone" }
                },
                context
            });

            datetime.apply({
                model,
                field: {
                    fieldId: "dateTimeWithoutTimezone",
                    type: "datetime",
                    settings: { type: "dateTimeWithoutTimezone" }
                },
                context
            });

            datetime.apply({
                model,
                field: {
                    fieldId: "date",
                    type: "datetime",
                    settings: { type: "date" }
                },
                context
            });

            datetime.apply({
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
                expect(() =>
                    instance.populate({ [field]: createValue(new Date()) })
                ).not.toThrow();
            });

            test(`"random string" should fail`, () => {
                expect(() =>
                    instance.populate({ [field]: createValue("random string") })
                ).toThrow();
            });

            test(`"2020-05-04T12:35:17Z" should pass`, () => {
                expect(() =>
                    instance.populate({ [field]: createValue("2020-05-04T12:35:17Z") })
                ).resolves;
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
