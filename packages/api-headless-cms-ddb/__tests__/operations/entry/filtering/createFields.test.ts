import { createFields } from "~/operations/entry/filtering/createFields";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createModel } from "../../helpers/createModel";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";

const expectedSystemFields: Record<string, Field> = {
    id: {
        id: "id",
        parents: [],
        type: "text",
        storageId: "id",
        fieldId: "id",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "ID"
    },
    entryId: {
        id: "entryId",
        parents: [],
        type: "text",
        storageId: "entryId",
        fieldId: "entryId",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Entry ID"
    },
    createdOn: {
        id: "createdOn",
        parents: [],
        type: "datetime",
        storageId: "createdOn",
        fieldId: "createdOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Created On"
    },
    savedOn: {
        id: "savedOn",
        parents: [],
        type: "datetime",
        storageId: "savedOn",
        fieldId: "savedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Saved On"
    },
    createdBy: {
        id: "createdBy",
        parents: [],
        type: "plainObject",
        storageId: "createdBy",
        fieldId: "createdBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Created By",
        settings: {
            path: "createdBy.id"
        }
    },
    meta: {
        id: "meta",
        parents: [],
        type: "plainObject",
        storageId: "meta",
        fieldId: "meta",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Meta"
    },
    ownedBy: {
        id: "ownedBy",
        parents: [],
        type: "plainObject",
        storageId: "ownedBy",
        fieldId: "ownedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Owned By",
        settings: {
            path: "ownedBy.id"
        }
    },
    version: {
        id: "version",
        parents: [],
        type: "number",
        storageId: "version",
        fieldId: "version",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Version"
    },
    status: {
        id: "status",
        parents: [],
        type: "text",
        storageId: "status",
        fieldId: "status",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Status"
    }
};

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

        expect(result).toEqual(expectedSystemFields);
    });

    it("should create system fields and model fields all the nested fields", async () => {
        const result = createFields({
            plugins,
            fields: model.fields
        });

        const expected: ExpectedFields = {
            ...expectedSystemFields,
            title: {
                id: "title",
                parents: [],
                type: "text",
                storageId: "text@titleStorageId",
                fieldId: "title",
                createPath: expect.any(Function),
                system: false,
                multipleValues: false,
                transform: expect.any(Function),
                label: "Title"
            },
            priority: {
                createPath: expect.any(Function),
                fieldId: "priority",
                id: "priority",
                label: "Priority",
                multipleValues: false,
                parents: [],
                storageId: "number@priorityStorageId",
                system: false,
                transform: expect.any(Function),
                type: "number"
            },
            parent: {
                createPath: expect.any(Function),
                fieldId: "parent",
                id: "parent",
                label: "Parent",
                multipleValues: false,
                parents: [],
                storageId: "ref@parentStorageId",
                system: false,
                transform: expect.any(Function),
                type: "ref"
            },
            authors: {
                createPath: expect.any(Function),
                fieldId: "authors",
                id: "authors",
                label: "Authors",
                multipleValues: true,
                parents: [],
                storageId: "ref@authorsStorageId",
                system: false,
                transform: expect.any(Function),
                type: "ref"
            },
            options: {
                id: "options",
                parents: [],
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
            "options.keys": {
                createPath: expect.any(Function),
                fieldId: "keys",
                id: "keys",
                label: "Keys",
                multipleValues: false,
                parents: [
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
            "options.optionId": {
                createPath: expect.any(Function),
                fieldId: "optionId",
                id: "optionId",
                label: "Option ID",
                multipleValues: false,
                parents: [
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
            "options.variant": {
                parents: [
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
            "options.variant.colors": {
                parents: [
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
            "options.variant.number": {
                parents: [
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
            info: {
                parents: [],
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
            "info.images": {
                parents: [
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
            "info.images.file": {
                parents: [
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
            "info.images.tags": {
                parents: [
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
            "info.images.tags.slug": {
                createPath: expect.any(Function),
                fieldId: "slug",
                id: "slug",
                label: "Slug",
                multipleValues: false,
                parents: [
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
            "info.images.tags.title": {
                createPath: expect.any(Function),
                fieldId: "title",
                id: "title",
                label: "Title",
                multipleValues: false,
                parents: [
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
            "info.images.title": {
                createPath: expect.any(Function),
                fieldId: "title",
                id: "title",
                label: "Title",
                multipleValues: false,
                parents: [
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
            "info.keywords": {
                createPath: expect.any(Function),
                fieldId: "keywords",
                id: "keywords",
                label: "Keywords",
                multipleValues: true,
                parents: [
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

        expect(result).toEqual(expected);
    });
});
