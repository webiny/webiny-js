import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types";

export const createModel = (): CmsModel => {
    const group: Pick<CmsGroup, "id" | "name"> = {
        id: "group",
        name: "Group"
    };

    return {
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        titleFieldId: "title",
        name: "Category",
        singularApiName: "Category",
        pluralApiName: "Categories",
        description: "Product category",
        modelId: "category",
        group: {
            id: group.id,
            name: group.name
        },
        layout: [["title"], ["options"], ["info"], ["settings"]],
        fields: [
            {
                id: "title",
                list: false,
                label: "Title",
                type: "text",
                storageId: "text@titleStorageId",
                fieldId: "title"
            },
            {
                id: "priority",
                list: false,
                label: "Priority",
                type: "number",
                storageId: "number@priorityStorageId",
                fieldId: "priority"
            },
            {
                id: "parent",
                list: false,
                label: "Parent",
                type: "ref",
                storageId: "ref@parentStorageId",
                fieldId: "parent"
            },
            {
                id: "authors",
                list: true,
                label: "Authors",
                type: "ref",
                storageId: "ref@authorsStorageId",
                fieldId: "authors"
            },
            {
                id: "options",
                list: true,
                label: "Options",
                type: "object",
                storageId: "object@optionsStorageId",
                fieldId: "options",
                settings: {
                    fields: [
                        {
                            id: "optionId",
                            list: false,
                            label: "Option ID",
                            type: "number",
                            storageId: "number@optionIdStorageId",
                            fieldId: "optionId"
                        },
                        {
                            id: "keys",
                            list: false,
                            label: "Keys",
                            type: "text",
                            storageId: "text@keysStorageId",
                            fieldId: "keys"
                        },
                        {
                            id: "variant",
                            list: false,
                            label: "Variant",
                            type: "object",
                            storageId: "object@variantStorageId",
                            fieldId: "variant",
                            settings: {
                                fields: [
                                    {
                                        id: "number",
                                        list: false,
                                        label: "Variant Number",
                                        type: "number",
                                        storageId: "number@variantNumberStorageId",
                                        fieldId: "number"
                                    },
                                    {
                                        id: "colors",
                                        list: true,
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
                list: false,
                label: "Info",
                type: "object",
                storageId: "object@infoStorageId",
                fieldId: "info",
                settings: {
                    fields: [
                        {
                            id: "keywords",
                            list: true,
                            label: "Keywords",
                            type: "text",
                            storageId: "text@infoKeywordsStorageId",
                            fieldId: "keywords"
                        },
                        {
                            id: "images",
                            list: true,
                            label: "Images",
                            type: "object",
                            storageId: "object@infoImagesStorageId",
                            fieldId: "images",
                            settings: {
                                fields: [
                                    {
                                        id: "file",
                                        list: false,
                                        label: "File",
                                        type: "file",
                                        storageId: "file@infoImagesFileStorageId",
                                        fieldId: "file"
                                    },
                                    {
                                        id: "title",
                                        list: false,
                                        label: "Title",
                                        type: "text",
                                        storageId: "text@infoImagesTitleStorageId",
                                        fieldId: "title"
                                    },
                                    {
                                        id: "tags",
                                        list: true,
                                        label: "Tags",
                                        type: "object",
                                        storageId: "object@infoImagesTagsStorageId",
                                        fieldId: "tags",
                                        settings: {
                                            fields: [
                                                {
                                                    id: "title",
                                                    list: false,
                                                    label: "Title",
                                                    type: "text",
                                                    storageId: "text@infoImagesTagsTitleStorageId",
                                                    fieldId: "title"
                                                },
                                                {
                                                    id: "slug",
                                                    list: false,
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
            },
            {
                id: "settings",
                list: false,
                type: "searchable-json",
                fieldId: "settings",
                storageId: "searchableJson@settings",
                label: "Settings"
            }
        ],
        tenant: "root"
    };
};
