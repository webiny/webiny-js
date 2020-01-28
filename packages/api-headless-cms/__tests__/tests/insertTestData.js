import { graphql } from "graphql";

const data = [
    {
        title: "Category",
        description: "Product category",
        modelId: "category",
        fields: [
            {
                id: "1",
                label: "Title",
                type: "text",
                fieldId: "title",
                validation: [
                    {
                        id: "required",
                        message: "This field is required"
                    },
                    {
                        id: "minLength",
                        min: 3.0,
                        message: "Enter at least 3 characters"
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
                id: "1",
                label: "Text",
                type: "text",
                fieldId: "text",
                validation: [
                    {
                        id: "required",
                        message: "This field is required"
                    }
                ]
            },
            {
                id: "2",
                label: "Products",
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
                id: "1",
                label: "Title",
                fieldId: "title",
                type: "text",
                validation: [
                    {
                        id: "required",
                        message: "Please enter a product name"
                    }
                ]
            },
            {
                id: "2",
                label: "Category",
                fieldId: "category",
                type: "ref",
                validation: [
                    {
                        id: "required",
                        message: "Please select a category"
                    }
                ],
                settings: {
                    type: "one",
                    modelId: "category"
                }
            },
            {
                id: "3",
                label: "Reviews",
                fieldId: "reviews",
                type: "ref",
                validation: [],
                settings: {
                    type: "many",
                    modelId: "review"
                }
            },
            {
                id: "4",
                label: "Price",
                fieldId: "price",
                type: "integer",
                validation: [
                    {
                        id: "required",
                        message: "Please enter a price"
                    }
                ]
            }
        ]
    }
];

export default async testing => {
    const mutation = /* GraphQL */ `
        mutation CreateContentModel($data: CmsContentModelInput!) {
            cmsManage {
                createContentModel(data: $data) {
                    data {
                        id
                        modelId
                    }
                    error {
                        code
                        data
                        message
                    }
                }
            }
        }
    `;

    for (let i = 0; i < data.length; i++) {
        await graphql(testing.schema, mutation, {}, testing.context, { data: data[i] });
    }
};
