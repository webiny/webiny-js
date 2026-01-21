import { beforeEach, describe, expect, it } from "vitest";
import { createFields } from "~/operations/entry/filtering/createFields";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createModel } from "../../helpers/createModel";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";
import { expectedSystemFields } from "./mocks/expectedSystemFields.js";

interface ExpectedFields {
    [key: string]: Field;
}

describe("create system and model fields", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;

    beforeEach(() => {
        plugins = createPluginsContainer();
        model = createModel();
    });

    it("should only create system fields", async () => {
        const testModel = {
            ...model,
            fields: [],
            layout: []
        };
        const result = createFields({
            plugins,
            fields: testModel.fields
        });

        expect(result).toMatchObject(expectedSystemFields);
    });

    it("should create system fields and model fields all the nested fields", async () => {
        const result = createFields({
            plugins,
            fields: model.fields
        });

        const expected: ExpectedFields = {
            ...expectedSystemFields,
            values: {
                id: "values",
                parents: [],
                type: "object",
                storageId: "values",
                fieldId: "values",
                createPath: expect.any(Function),
                system: true,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Values",
                settings: expect.any(Object)
            },
            "values.settings": {
                createPath: expect.any(Function),
                fieldId: "settings",
                id: "settings",
                label: "Settings",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                storageId: "searchableJson@settings",
                system: false,
                transform: expect.any(Function),
                type: "searchable-json"
            },
            "values.title": {
                id: "title",
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                type: "text",
                storageId: "text@titleStorageId",
                fieldId: "title",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Title"
            },
            "values.priority": {
                createPath: expect.any(Function),
                fieldId: "priority",
                id: "priority",
                label: "Priority",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                storageId: "number@priorityStorageId",
                system: false,
                transform: expect.any(Function),
                type: "number"
            },
            "values.parent": {
                createPath: expect.any(Function),
                fieldId: "parent",
                id: "parent",
                label: "Parent",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                storageId: "ref@parentStorageId",
                system: false,
                transform: expect.any(Function),
                type: "ref"
            },
            "values.authors": {
                createPath: expect.any(Function),
                fieldId: "authors",
                id: "authors",
                label: "Authors",
                multipleValues: true,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                storageId: "ref@authorsStorageId",
                system: false,
                transform: expect.any(Function),
                type: "ref"
            },
            "values.options": {
                id: "options",
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                type: "object",
                storageId: "object@optionsStorageId",
                fieldId: "options",
                createPath: expect.any(Function),
                system: false,
                multipleValues: true,
                transform: expect.any(Function),
                label: "Options",
                settings: expect.any(Object)
            },
            "values.options.keys": {
                createPath: expect.any(Function),
                fieldId: "keys",
                id: "keys",
                label: "Keys",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "options",
                        multipleValues: true
                    }
                ],
                storageId: "text@keysStorageId",
                system: false,
                transform: expect.any(Function),
                type: "text"
            },
            "values.options.optionId": {
                createPath: expect.any(Function),
                fieldId: "optionId",
                id: "optionId",
                label: "Option ID",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "options",
                        multipleValues: true
                    }
                ],
                storageId: "number@optionIdStorageId",
                system: false,
                transform: expect.any(Function),
                type: "number"
            },
            "values.options.variant": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "options",
                        multipleValues: true
                    }
                ],
                id: "variant",
                type: "object",
                storageId: "object@variantStorageId",
                fieldId: "variant",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Variant",
                settings: expect.any(Object)
            },
            "values.options.variant.colors": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "options",
                        multipleValues: true
                    },
                    {
                        fieldId: "variant",
                        multipleValues: false
                    }
                ],
                id: "colors",
                type: "text",
                storageId: "text@variantColorsStorageId",
                fieldId: "colors",
                createPath: expect.any(Function),
                system: false,
                multipleValues: true,
                transform: expect.any(Function),
                label: "Variant Colors"
            },
            "values.options.variant.number": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "options",
                        multipleValues: true
                    },
                    {
                        fieldId: "variant",
                        multipleValues: false
                    }
                ],
                id: "number",
                type: "number",
                storageId: "number@variantNumberStorageId",
                fieldId: "number",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Variant Number"
            },
            "values.info": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    }
                ],
                id: "info",
                type: "object",
                storageId: "object@infoStorageId",
                fieldId: "info",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Info",
                settings: expect.any(Object)
            },
            "values.info.images": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    }
                ],
                id: "images",
                type: "object",
                storageId: "object@infoImagesStorageId",
                fieldId: "images",
                createPath: expect.any(Function),
                system: false,
                multipleValues: true,
                transform: expect.any(Function),
                label: "Images",
                settings: expect.any(Object)
            },
            "values.info.images.file": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    },
                    {
                        fieldId: "images",
                        multipleValues: true
                    }
                ],
                id: "file",
                type: "file",
                storageId: "file@infoImagesFileStorageId",
                fieldId: "file",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "File"
            },
            "values.info.images.tags": {
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    },
                    {
                        fieldId: "images",
                        multipleValues: true
                    }
                ],
                id: "tags",
                type: "object",
                storageId: "object@infoImagesTagsStorageId",
                fieldId: "tags",
                createPath: expect.any(Function),
                system: false,
                multipleValues: true,
                transform: expect.any(Function),
                label: "Tags",
                settings: expect.any(Object)
            },
            "values.info.images.tags.slug": {
                createPath: expect.any(Function),
                fieldId: "slug",
                id: "slug",
                label: "Slug",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    },
                    {
                        fieldId: "images",
                        multipleValues: true
                    },
                    {
                        fieldId: "tags",
                        multipleValues: true
                    }
                ],
                storageId: "text@infoImagesTagsSlugStorageId",
                system: false,
                transform: expect.any(Function),
                type: "text"
            },
            "values.info.images.tags.title": {
                createPath: expect.any(Function),
                fieldId: "title",
                id: "title",
                label: "Title",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    },
                    {
                        fieldId: "images",
                        multipleValues: true
                    },
                    {
                        fieldId: "tags",
                        multipleValues: true
                    }
                ],
                storageId: "text@infoImagesTagsTitleStorageId",
                system: false,
                transform: expect.any(Function),
                type: "text"
            },
            "values.info.images.title": {
                createPath: expect.any(Function),
                fieldId: "title",
                id: "title",
                label: "Title",
                multipleValues: false,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    },
                    {
                        fieldId: "images",
                        multipleValues: true
                    }
                ],
                storageId: "text@infoImagesTitleStorageId",
                system: false,
                transform: expect.any(Function),
                type: "text"
            },
            "values.info.keywords": {
                createPath: expect.any(Function),
                fieldId: "keywords",
                id: "keywords",
                label: "Keywords",
                multipleValues: true,
                parents: [
                    {
                        fieldId: "values",
                        multipleValues: false
                    },
                    {
                        fieldId: "info",
                        multipleValues: false
                    }
                ],
                storageId: "text@infoKeywordsStorageId",
                system: false,
                transform: expect.any(Function),
                type: "text"
            }
        };
        for (const expectedKey in expected) {
            expect(result).toHaveProperty(expectedKey);
            const value = result[expectedKey];
            const expectedValue = expected[expectedKey];
            expect(value).toMatchObject(expectedValue);
        }

        for (const resultKey in result) {
            expect(expected).toHaveProperty(resultKey);
            const value = result[resultKey];
            const expectedValue = expected[resultKey];
            expect(value).toMatchObject(expectedValue);
        }

        expect(result).toMatchObject(expected);
    });
});
