import { createModelField } from "~/index";
import { createPrivateModelPlugin } from "~/plugins";

export const articleModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [
        createModelField({
            id: "title",
            multipleValues: false,
            label: "Title",
            type: "text",
            storageId: "text@title",
            fieldId: "title"
        }),
        createModelField({
            id: "body",
            multipleValues: false,
            label: "Body",
            type: "rich-text",
            storageId: "rich-text@body",
            fieldId: "body"
        }),
        createModelField({
            id: "categories",
            multipleValues: true,
            label: "Categories",
            type: "ref",
            storageId: "ref@categories",
            fieldId: "categories",
            settings: {
                models: [{ modelId: "category" }]
            }
        }),
        createModelField({
            id: "content",
            fieldId: "content",
            storageId: "dynamicZone@content",
            type: "dynamicZone",
            label: "Content",
            multipleValues: true,
            settings: {
                templates: [
                    {
                        name: "Hero #1",
                        gqlTypeName: "Hero",
                        icon: "fas/flag",
                        description: "The top piece of content on every page.",
                        id: "cv2zf965v324ivdc7e1vt",
                        fields: [
                            createModelField({
                                id: "title",
                                fieldId: "title",
                                label: "Title",
                                type: "text"
                            })
                        ]
                    },
                    {
                        name: "Simple Text #1",
                        gqlTypeName: "SimpleText",
                        icon: "fas/file-text",
                        description: "Simple paragraph of text.",
                        id: "81qiz2v453wx9uque0gox",
                        fields: [
                            createModelField({
                                id: "text",
                                fieldId: "text",
                                label: "Text",
                                type: "long-text"
                            })
                        ]
                    },
                    {
                        name: "Settings",
                        gqlTypeName: "Settings",
                        icon: "fas/file-text",
                        description: "Settings",
                        id: "9ht43gurhegkbdfsaafyads",
                        fields: [
                            createModelField({
                                id: "settings",
                                fieldId: "settings",
                                label: "Settings",
                                type: "object",
                                settings: {
                                    fields: [
                                        createModelField({
                                            id: "title",
                                            fieldId: "title",
                                            type: "text",
                                            label: "Title"
                                        }),
                                        createModelField({
                                            id: "seo",
                                            fieldId: "seo",
                                            type: "object",
                                            label: "SEO",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    createModelField({
                                                        id: "title",
                                                        fieldId: "title",
                                                        type: "text",
                                                        label: "Title"
                                                    })
                                                ]
                                            }
                                        })
                                    ]
                                }
                            }),
                            createModelField({
                                type: "dynamicZone",
                                settings: {
                                    templates: [
                                        {
                                            name: "Ad",
                                            gqlTypeName: "Ad",
                                            icon: "fab/buysellads",
                                            description: "Ad",
                                            id: "0emukbsvmzpozx2lzk883",
                                            fields: [
                                                createModelField({
                                                    type: "ref",
                                                    settings: {
                                                        models: [
                                                            {
                                                                modelId: "author"
                                                            }
                                                        ]
                                                    },
                                                    multipleValues: true,
                                                    label: "Authors",
                                                    fieldId: "authors",
                                                    id: "tuuehcqp"
                                                })
                                            ]
                                        }
                                    ]
                                },
                                label: "DynamicZone",
                                fieldId: "dynamicZone",
                                id: "nli9u1rm"
                            }),
                            /**
                             * Add a dynamic zone field without any templates, to test for correct schema generation.
                             */
                            createModelField({
                                type: "dynamicZone",
                                settings: {
                                    templates: []
                                },
                                label: "DynamicZone",
                                fieldId: "emptyDynamicZone",
                                id: "lsd78slxc8"
                            })
                        ]
                    }
                ]
            }
        })
    ]
});
