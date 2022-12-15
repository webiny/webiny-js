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
                storageId: "titleStorageId",
                fieldId: "title"
            },
            {
                id: "options",
                multipleValues: true,
                label: "Options",
                type: "object",
                storageId: "optionsStorageId",
                fieldId: "options",
                settings: {
                    fields: [
                        {
                            id: "variant",
                            multipleValues: false,
                            label: "Variant",
                            type: "object",
                            storageId: "variantStorageId",
                            fieldId: "variant",
                            settings: {
                                fields: [
                                    {
                                        id: "number",
                                        multipleValues: false,
                                        label: "Variant Number",
                                        type: "number",
                                        storageId: "variantNumberStorageId",
                                        fieldId: "number"
                                    },
                                    {
                                        id: "colors",
                                        multipleValues: true,
                                        label: "Variant Colors",
                                        type: "text",
                                        storageId: "variantColorsStorageId",
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
                storageId: "infoStorageId",
                fieldId: "info",
                settings: {
                    fields: [
                        {
                            id: "keywords",
                            multipleValues: true,
                            label: "Keywords",
                            type: "text",
                            storageId: "infoKeywordsStorageId",
                            fieldId: "keywords"
                        },
                        {
                            id: "images",
                            multipleValues: true,
                            label: "Images",
                            type: "object",
                            storageId: "infoImagesStorageId",
                            fieldId: "images",
                            settings: {
                                fields: [
                                    {
                                        id: "file",
                                        multipleValues: false,
                                        label: "File",
                                        type: "file",
                                        storageId: "infoImagesFileStorageId",
                                        fieldId: "file"
                                    },
                                    {
                                        id: "title",
                                        multipleValues: false,
                                        label: "Title",
                                        type: "text",
                                        storageId: "infoImagesTitleStorageId",
                                        fieldId: "title"
                                    },
                                    {
                                        id: "tags",
                                        multipleValues: true,
                                        label: "Tags",
                                        type: "object",
                                        storageId: "infoImagesTagsStorageId",
                                        fieldId: "tags",
                                        settings: {
                                            fields: [
                                                {
                                                    id: "title",
                                                    multipleValues: false,
                                                    label: "Title",
                                                    type: "text",
                                                    storageId: "infoImagesTagsTitleStorageId",
                                                    fieldId: "title"
                                                },
                                                {
                                                    id: "slug",
                                                    multipleValues: false,
                                                    label: "Slug",
                                                    type: "text",
                                                    storageId: "infoImagesTagsSlugStorageId",
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
