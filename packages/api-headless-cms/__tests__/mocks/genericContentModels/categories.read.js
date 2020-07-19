import { locales } from "@webiny/api-i18n/testing";

export default async () => {
    const categories = await content("category");
    initial.categories = [];
    for (let i = 0; i < categoriesMock.length; i++) {
        let categoriesMockElement = categoriesMock[i];
        const category = await categories.create({ data: categoriesMockElement });
        // Publish first three only.
        if (i < 3) {
            await categories.publish({ revision: category.id });
        }
        initial.categories.push(category);
    }
}

const DATA =  [
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
