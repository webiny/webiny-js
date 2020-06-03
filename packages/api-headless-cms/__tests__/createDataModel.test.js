import setupContentModels from "./setup/setupContentModels";
import setupDefaultEnvironment from "./setup/setupDefaultEnvironment";
import contentModels from "./mocks/contentModels";
import { locales } from "./mocks/I18NLocales";
import { createUtils } from "./utils";
import { createDataModel } from "../src/content/plugins/utils/createDataModel";
import headlessPlugins from "../src/content/plugins";

describe(`createDataModel`, () => {
    let context;

    const { useContext, useDatabase } = createUtils([
        headlessPlugins({ type: "read", environment: "production" })
    ]);

    const db = useDatabase();
    let models = [];

    beforeAll(async () => {
        await setupDefaultEnvironment(db);

        // Setup context
        context = await useContext([], {
            event: { headers: { "accept-language": "en-US" } }
        });

        const { contentModelInstances } = await setupContentModels(context);
        models = contentModelInstances;
    });

    test("data is converted to commodo model", async () => {
        // Create content models
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            context.models[model.modelId] = createDataModel(
                context.models.createEnvironmentBase,
                model,
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
            // TODO: fix this, the "entry" only has the "title" property in the "fields" key, but "slug" field is present
            // TODO: in content model's indexes list. Errors at dataManager/handler/createRevisionIndexes.ts:37
            await product.save();
        } catch (e) {
            if (e.data) {
                console.log(e.data.invalidFields);
            } else {
                console.log(e);
            }

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
