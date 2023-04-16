import { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types";

export const createModel = (): CmsModel => {
    const group: Pick<CmsGroup, "id" | "name"> = {
        id: "group",
        name: "Group"
    };

    return {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        locale: "en-US",
        titleFieldId: "title",
        lockedFields: [],
        name: "Category",
        singularApiName: "Category",
        pluralApiName: "Categories",
        description: "Product category",
        modelId: "category",
        group: {
            id: group.id,
            name: group.name
        },
        layout: [["title"], ["options"], ["info"]],
        fields: [
            {
                id: "title",
                multipleValues: false,
                label: "Title",
                type: "text",
                storageId: "text@titleStorageId",
                fieldId: "title"
            },
            {
                id: "priority",
                multipleValues: false,
                label: "Priority",
                type: "number",
                storageId: "number@priorityStorageId",
                fieldId: "priority"
            },
            {
                id: "parent",
                multipleValues: false,
                label: "Parent",
                type: "ref",
                storageId: "ref@parentStorageId",
                fieldId: "parent"
            },
            {
                id: "authors",
                multipleValues: true,
                label: "Authors",
                type: "ref",
                storageId: "ref@authorsStorageId",
                fieldId: "authors"
            },
            {
                id: "options",
                multipleValues: true,
                label: "Options",
                type: "object",
                storageId: "object@optionsStorageId",
                fieldId: "options",
                settings: {
                    fields: [
                        {
                            id: "optionId",
                            multipleValues: false,
                            label: "Option ID",
                            type: "number",
                            storageId: "number@optionIdStorageId",
                            fieldId: "optionId"
                        },
                        {
                            id: "keys",
                            multipleValues: false,
                            label: "Keys",
                            type: "text",
                            storageId: "text@keysStorageId",
                            fieldId: "keys"
                        },
                        {
                            id: "variant",
                            multipleValues: false,
                            label: "Variant",
                            type: "object",
                            storageId: "object@variantStorageId",
                            fieldId: "variant",
                            settings: {
                                fields: [
                                    {
                                        id: "number",
                                        multipleValues: false,
                                        label: "Variant Number",
                                        type: "number",
                                        storageId: "number@variantNumberStorageId",
                                        fieldId: "number"
                                    },
                                    {
                                        id: "colors",
                                        multipleValues: true,
                                        label: "Variant Colors",
                                        type: "text",
                                        storageId: "text@variantColorsStorageId",
                                        fieldId: "colors"
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                id: "info",
                multipleValues: false,
                label: "Info",
                type: "object",
                storageId: "object@infoStorageId",
                fieldId: "info",
                settings: {
                    fields: [
                        {
                            id: "keywords",
                            multipleValues: true,
                            label: "Keywords",
                            type: "text",
                            storageId: "text@infoKeywordsStorageId",
                            fieldId: "keywords"
                        },
                        {
                            id: "images",
                            multipleValues: true,
                            label: "Images",
                            type: "object",
                            storageId: "object@infoImagesStorageId",
                            fieldId: "images",
                            settings: {
                                fields: [
                                    {
                                        id: "file",
                                        multipleValues: false,
                                        label: "File",
                                        type: "file",
                                        storageId: "file@infoImagesFileStorageId",
                                        fieldId: "file"
                                    },
                                    {
                                        id: "title",
                                        multipleValues: false,
                                        label: "Title",
                                        type: "text",
                                        storageId: "text@infoImagesTitleStorageId",
                                        fieldId: "title"
                                    },
                                    {
                                        id: "tags",
                                        multipleValues: true,
                                        label: "Tags",
                                        type: "object",
                                        storageId: "object@infoImagesTagsStorageId",
                                        fieldId: "tags",
                                        settings: {
                                            fields: [
                                                {
                                                    id: "title",
                                                    multipleValues: false,
                                                    label: "Title",
                                                    type: "text",
                                                    storageId: "text@infoImagesTagsTitleStorageId",
                                                    fieldId: "title"
                                                },
                                                {
                                                    id: "slug",
                                                    multipleValues: false,
                                                    label: "Slug",
                                                    type: "text",
                                                    storageId: "text@infoImagesTagsSlugStorageId",
                                                    fieldId: "slug"
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ],
        tenant: "root",
        webinyVersion: "x.x.x"
    };
};
