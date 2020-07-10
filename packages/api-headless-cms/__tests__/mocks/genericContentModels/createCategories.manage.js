import { locales } from "@webiny/api-i18n/testing";

export default [
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
    }
]
