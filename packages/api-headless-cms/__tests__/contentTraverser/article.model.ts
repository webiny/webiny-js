import { createPrivateModel } from "~/plugins";

export const articleModel = createPrivateModel({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [
        {
            id: "title",
            multipleValues: false,
            label: "Title",
            type: "text",
            storageId: "text@title",
            fieldId: "title"
        },
        {
            id: "body",
            multipleValues: false,
            label: "Body",
            type: "rich-text",
            storageId: "rich-text@body",
            fieldId: "body"
        },
        {
            id: "categories",
            multipleValues: true,
            label: "Categories",
            type: "ref",
            storageId: "ref@categories",
            fieldId: "categories",
            settings: {
                models: [{ modelId: "category" }]
            }
        },
        {
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
                            {
                                id: "title",
                                fieldId: "title",
                                label: "Title",
                                type: "text"
                            }
                        ]
                    },
                    {
                        name: "Simple Text #1",
                        gqlTypeName: "SimpleText",
                        icon: "fas/file-text",
                        description: "Simple paragraph of text.",
                        id: "81qiz2v453wx9uque0gox",
                        fields: [
                            {
                                id: "text",
                                fieldId: "text",
                                label: "Text",
                                type: "long-text"
                            }
                        ]
                    },
                    {
                        name: "Objecting",
                        gqlTypeName: "Objecting",
                        icon: "fas/file-text",
                        description: "Objecting test.",
                        id: "9ht43gurhegkbdfsaafyads",
                        fields: [
                            {
                                id: "nestedObject",
                                fieldId: "nestedObject",
                                label: "Nested Object",
                                type: "object",
                                settings: {
                                    fields: [
                                        {
                                            id: "objectTitle",
                                            fieldId: "objectTitle",
                                            type: "text",
                                            label: "Object title"
                                        },
                                        {
                                            id: "objectNestedObject",
                                            fieldId: "objectNestedObject",
                                            type: "object",
                                            label: "Object nested object",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    {
                                                        id: "nestedObjectNestedTitle",
                                                        fieldId: "nestedObjectNestedTitle",
                                                        type: "text",
                                                        label: "Nested object nested title"
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: "dynamicZone",
                                settings: {
                                    templates: [
                                        {
                                            name: "SuperNestedObject",
                                            gqlTypeName: "SuperNestedObject",
                                            icon: "fab/buysellads",
                                            description: "SuperNestedObject",
                                            id: "0emukbsvmzpozx2lzk883",
                                            fields: [
                                                {
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
                                                }
                                            ]
                                        }
                                    ]
                                },
                                label: "DynamicZone",
                                fieldId: "dynamicZone",
                                id: "nli9u1rm"
                            },
                            /**
                             * Add a dynamic zone field without any templates, to test for correct schema generation.
                             */
                            {
                                type: "dynamicZone",
                                settings: {
                                    templates: []
                                },
                                label: "DynamicZone",
                                fieldId: "emptyDynamicZone",
                                id: "lsd78slxc8"
                            }
                        ]
                    }
                ]
            }
        }
    ]
});
