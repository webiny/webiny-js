import { describe, it, expect } from "vitest";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { Container } from "@webiny/di";
import { GetFolderExtensionsFieldsFeature } from "~/features/folders/getFolderExtensionsFields/feature.js";
import { GetFolderExtensionsFieldsUseCase } from "~/features/folders/getFolderExtensionsFields/abstractions.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ListCache } from "~/features/folders/cache/index.js";
import type { Folder } from "~/domain/folder/Folder.js";

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
        tags: ["type:model"]
    } as unknown as CmsModel;

    function setupTest(type: string) {
        const container = new Container();
        const foldersCache = new ListCache<Folder>();

        container.registerInstance(FoldersContext, { type });
        container.registerInstance(FoldersCache, foldersCache);

        GetFolderExtensionsFieldsFeature.register(container);
        container.registerInstance(FolderModelProvider, {
            getModel: () => Promise.resolve(model),
            getGraphQLSelection: () => Promise.resolve("")
        });

        return { container, useCase: container.resolve(GetFolderExtensionsFieldsUseCase) };
    }

    it("CMS: should return fields from `global`, `cms` and the provided model namespace", async () => {
        const { useCase } = setupTest("cms:article");

        const fields = await useCase.execute();

        expect(fields.map(field => field.id)).toEqual([
            "globalField",
            "cms_cmsField",
            "cms_article_authorArticleField"
        ]);
    });

    it("CMS: should return fields from `global` and `cms` namespace if not fields found for the provided model namespace", async () => {
        const { useCase } = setupTest("cms:other");

        const fields = await useCase.execute();
        expect(fields.map(field => field.id)).toEqual(["globalField", "cms_cmsField"]);
    });

    it("FILE MANAGER: should return fields from `global` and `fm_file` namespace", async () => {
        const { useCase } = setupTest("FmFile");

        const fields = await useCase.execute();
        expect(fields.map(field => field.id)).toEqual(["globalField", "fm_file_fileField"]);
    });

    it("ANY OTHER APP: should return fields from `global` namespace", async () => {
        const { useCase } = setupTest("Any");

        const fields = await useCase.execute();
        expect(fields.map(field => field.id)).toEqual(["globalField"]);
    });
});
