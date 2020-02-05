import shortId from "shortid";
import { locales } from "../../mocks/mockI18NLocales";

export default [
    {
        title: "Category",
        description: "Product category",
        modelId: "category",
        fields: [
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Title" }]
                },
                type: "text",
                fieldId: "title",
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [{ locale: locales.en.id, value: "This field is required" }]
                        }
                    },
                    {
                        name: "minLength",
                        message: {
                            values: [
                                { locale: locales.en.id, value: "Enter at least 3 characters" }
                            ]
                        },
                        settings: {
                            min: 3.0
                        }
                    }
                ]
            }
        ]
    },
    {
        title: "Review",
        description: "Product review",
        modelId: "review",
        fields: [
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Text" }]
                },
                type: "text",
                fieldId: "text",
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [{ locale: locales.en.id, value: "This field is required" }]
                        }
                    }
                ]
            },
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Products" }]
                },
                type: "ref",
                fieldId: "products",
                validation: [],
                settings: {
                    type: "many",
                    modelId: "product"
                }
            }
        ]
    },
    {
        title: "Product",
        modelId: "product",
        description: "Products being sold in our webshop",
        fields: [
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Title" }]
                },
                fieldId: "title",
                type: "text",
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [
                                { locale: locales.en.id, value: "Please enter a product name" }
                            ]
                        }
                    }
                ]
            },
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Category" }]
                },
                fieldId: "category",
                type: "ref",
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [{ locale: locales.en.id, value: "Please select a category" }]
                        }
                    }
                ],
                settings: {
                    type: "one",
                    modelId: "category"
                }
            },
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Reviews" }]
                },
                fieldId: "reviews",
                type: "ref",
                validation: [],
                settings: {
                    type: "many",
                    modelId: "review"
                }
            },
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Price" }]
                },
                fieldId: "price",
                type: "integer",
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [{ locale: locales.en.id, value: "Please enter a price" }]
                        }
                    }
                ]
            },
            {
                _id: shortId.generate(),
                label: {
                    values: [{ locale: locales.en.id, value: "Available on" }]
                },
                fieldId: "availableOn",
                type: "datetime",
                settings: {
                  type: "date"
                },
                validation: [
                    {
                        name: "required",
                        message: {
                            values: [{ locale: locales.en.id, value: "Please enter a date" }]
                        }
                    }
                ]
            }
        ]
    }
];
