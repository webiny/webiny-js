import locales from "../../mocks/mockI18NLocales";

export default {
    category: () => ({
        title: {
            values: [
                { locale: locales.en.id, value: "Hardware EN" },
                { locale: locales.de.id, value: "Hardware DE" }
            ]
        }
    }),
    product: ({ category }) => ({
        title: {
            values: [
                { locale: locales.en.id, value: "Laptop EN" },
                { locale: locales.de.id, value: "Laptop DE" }
            ]
        },
        category: {
            values: [
                { locale: locales.en.id, value: category.id },
                { locale: locales.de.id, value: category.id }
            ]
        },
        price: {

        }
    }),
    review: ({ product }) => ({

    })
};
