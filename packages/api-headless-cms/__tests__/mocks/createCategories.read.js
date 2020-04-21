import { locales } from "./mockI18NLocales";

export default async context => {
    const { category: Category } = context.models;
    const category1 = new Category();

    const data = [
        {
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
        },
        {
            title: {
                values: [
                    { locale: locales.en.id, value: "A Category EN" },
                    { locale: locales.de.id, value: "A Category DE" },
                    { locale: locales.it.id, value: "A Category IT" }
                ]
            },
            slug: {
                values: [
                    { locale: locales.en.id, value: "a-category-en" },
                    { locale: locales.de.id, value: "a-category-de" }
                    // do NOT define `it` locale value - it's on purpose
                ]
            }
        },
        {
            title: {
                values: [
                    { locale: locales.en.id, value: "B Category EN" },
                    { locale: locales.de.id, value: "B Category DE" }
                    // do NOT define `it` locale value - it's on purpose
                ]
            },
            slug: {
                values: [
                    { locale: locales.en.id, value: "b-category-en" },
                    { locale: locales.de.id, value: "b-category-de" }
                    // do NOT define `it` locale value - it's on purpose
                ]
            }
        },
        {
            title: {
                values: [
                    { locale: locales.en.id, value: "Framework" },
                    { locale: locales.de.id, value: "Framework DE" }
                ]
            },
            slug: {
                values: [
                    { locale: locales.en.id, value: "framework-en" },
                    { locale: locales.de.id, value: "framework-de" }
                ]
            }
        }
    ];

    await category1.populate({ meta: { published: true }, ...data[0] }).save();

    const category2 = new Category();
    await category2.populate({ meta: { published: true }, ...data[1] }).save();

    const category3 = new Category();
    await category3.populate({ meta: { published: true }, ...data[2] }).save();

    const category4 = new Category();
    await category4.populate(data[3]).save();

    return [category1, category2, category3, category4].map((model, i) => ({
        model,
        data: { id: model.id, ...data[i] }
    }));
};
