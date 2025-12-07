// @ts-nocheck TODO
import { describe, it, expect } from "vitest";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

describe("GetFolderExtensionsFields", () => {
    const model = {
        group: {
            id: "private",
            name: "Private Models"
        },
        description: "",
        fields: [
            {
                id: "title",
                storageId: "text@title",
                fieldId: "title",
                label: "Title",
                type: "text",
                settings: {},
                listValidation: [],
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ],
                multipleValues: false,
                predefinedValues: {
                    values: [],
                    enabled: false
                }
            },
            {
                id: "extensions",
                storageId: "object@extensions",
                fieldId: "extensions",
                label: "Extensions",
                type: "object",
                settings: {
                    layout: [],
                    fields: [
                        {
                            id: "globalField",
                            fieldId: "globalField",
                            label: "Global Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@global_globalField",
                            tags: ["$namespace:global"]
                        },
                        {
                            id: "cms_cmsField",
                            fieldId: "cms_cmsField",
                            label: "Cms Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@cms_cmsField",
                            tags: ["$namespace:cms"]
                        },
                        {
                            id: "cms_author_authorArticleField",
                            fieldId: "cms_author_authorArticleField",
                            label: "Author / Article Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@cms_author_authorArticleField",
                            tags: ["$namespace:cms", "$modelId:author"]
                        },
                        {
                            id: "cms_article_authorArticleField",
                            fieldId: "cms_article_authorArticleField",
                            label: "Author / Article Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@cms_article_authorArticleField",
                            tags: ["$namespace:cms", "$modelId:article"]
                        },
                        {
                            id: "pb_page_pageField",
                            fieldId: "pb_page_pageField",
                            label: "Page Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@pb_page_pageField",
                            tags: ["$namespace:pb_page"]
                        },
                        {
                            id: "fm_file_fileField",
                            fieldId: "fm_file_fileField",
                            label: "File Field",
                            type: "text",
                            renderer: {
                                name: "text-input"
                            },
                            storageId: "text@fm_file_fileField",
                            tags: ["$namespace:fm_file"]
                        }
                    ]
                },
                listValidation: [],
                validation: [],
                multipleValues: false,
                predefinedValues: {
                    values: [],
                    enabled: false
                },
                helpText: null,
                placeholderText: null,
                renderer: null
            }
        ],
        modelId: "acoFolder",
        name: "ACO - Folder",
        pluralApiName: "AcoFolders",
        singularApiName: "AcoFolder",
        titleFieldId: "title",
        locale: "en-US",
        tenant: "root",
        authorization: {
            permissions: false
        },
        tags: ["type:model"],
        webinyVersion: "0.0.0"
    } as unknown as CmsModel;

    it("CMS: should return fields from `global`, `cms` and the provided model namespace", () => {
        const instance = GetFolderExtensionsFields.getInstance(model, "cms", "article");

        const result = instance.execute();

        expect(result.fields.map(field => field.id)).toEqual([
            "globalField",
            "cms_cmsField",
            "cms_article_authorArticleField"
        ]);
    });

    it("CMS: should return fields from `global` and `cms` namespace if not fields found for the provided model namespace", () => {
        const instance = GetFolderExtensionsFields.getInstance(model, "cms", "other");
        const result = instance.execute();
        expect(result.fields.map(field => field.id)).toEqual(["globalField", "cms_cmsField"]);
    });

    it("PAGE BUILDER: should return fields from `global` and `pb_page` namespace", () => {
        const instance = GetFolderExtensionsFields.getInstance(model, "PbPage", "");
        const result = instance.execute();
        expect(result.fields.map(field => field.id)).toEqual(["globalField", "pb_page_pageField"]);
    });

    it("FILE MANAGER: should return fields from `global` and `fm_file` namespace", () => {
        const instance = GetFolderExtensionsFields.getInstance(model, "FmFile", "");
        const result = instance.execute();
        expect(result.fields.map(field => field.id)).toEqual(["globalField", "fm_file_fileField"]);
    });

    it("ANY OTHER APP: should return fields from `global` namespace", () => {
        const instance = GetFolderExtensionsFields.getInstance(model, "Any", "");
        const result = instance.execute();
        expect(result.fields.map(field => field.id)).toEqual(["globalField"]);
    });
});
