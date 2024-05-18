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
    revisionCreatedOn: {
        id: "revisionCreatedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionCreatedOn",
        fieldId: "revisionCreatedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Created On"
    },
    revisionModifiedOn: {
        id: "revisionModifiedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionModifiedOn",
        fieldId: "revisionModifiedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Modified On"
    },
    revisionSavedOn: {
        id: "revisionSavedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionSavedOn",
        fieldId: "revisionSavedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Saved On"
    },
    revisionDeletedOn: {
        id: "revisionDeletedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionDeletedOn",
        fieldId: "revisionDeletedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Deleted On"
    },
    revisionRestoredOn: {
        id: "revisionRestoredOn",
        parents: [],
        type: "datetime",
        storageId: "revisionRestoredOn",
        fieldId: "revisionRestoredOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Restored On"
    },
    revisionFirstPublishedOn: {
        id: "revisionFirstPublishedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionFirstPublishedOn",
        fieldId: "revisionFirstPublishedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision First Published On"
    },
    revisionLastPublishedOn: {
        id: "revisionLastPublishedOn",
        parents: [],
        type: "datetime",
        storageId: "revisionLastPublishedOn",
        fieldId: "revisionLastPublishedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Last Published On"
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
    modifiedOn: {
        id: "modifiedOn",
        parents: [],
        type: "datetime",
        storageId: "modifiedOn",
        fieldId: "modifiedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Modified On"
    },
    deletedOn: {
        id: "deletedOn",
        parents: [],
        type: "datetime",
        storageId: "deletedOn",
        fieldId: "deletedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Deleted On"
    },
    restoredOn: {
        id: "restoredOn",
        parents: [],
        type: "datetime",
        storageId: "restoredOn",
        fieldId: "restoredOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Restored On"
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
    firstPublishedOn: {
        id: "firstPublishedOn",
        parents: [],
        type: "datetime",
        storageId: "firstPublishedOn",
        fieldId: "firstPublishedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "First Published On"
    },
    lastPublishedOn: {
        id: "lastPublishedOn",
        parents: [],
        type: "datetime",
        storageId: "lastPublishedOn",
        fieldId: "lastPublishedOn",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Last Published On"
    },
    revisionCreatedBy: {
        id: "revisionCreatedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionCreatedBy",
        fieldId: "revisionCreatedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Created By",
        settings: {
            path: "revisionCreatedBy.id"
        }
    },
    revisionModifiedBy: {
        id: "revisionModifiedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionModifiedBy",
        fieldId: "revisionModifiedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Modified By",
        settings: {
            path: "revisionModifiedBy.id"
        }
    },
    revisionSavedBy: {
        id: "revisionSavedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionSavedBy",
        fieldId: "revisionSavedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Saved By",
        settings: {
            path: "revisionSavedBy.id"
        }
    },
    revisionDeletedBy: {
        id: "revisionDeletedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionDeletedBy",
        fieldId: "revisionDeletedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Deleted By",
        settings: {
            path: "revisionDeletedBy.id"
        }
    },
    revisionRestoredBy: {
        id: "revisionRestoredBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionRestoredBy",
        fieldId: "revisionRestoredBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Restored By",
        settings: {
            path: "revisionRestoredBy.id"
        }
    },
    revisionFirstPublishedBy: {
        id: "revisionFirstPublishedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionFirstPublishedBy",
        fieldId: "revisionFirstPublishedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision First Published By",
        settings: {
            path: "revisionFirstPublishedBy.id"
        }
    },
    revisionLastPublishedBy: {
        id: "revisionLastPublishedBy",
        parents: [],
        type: "plainObject",
        storageId: "revisionLastPublishedBy",
        fieldId: "revisionLastPublishedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Revision Last Published By",
        settings: {
            path: "revisionLastPublishedBy.id"
        }
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
    modifiedBy: {
        id: "modifiedBy",
        parents: [],
        type: "plainObject",
        storageId: "modifiedBy",
        fieldId: "modifiedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Modified By",
        settings: {
            path: "modifiedBy.id"
        }
    },
    savedBy: {
        id: "savedBy",
        parents: [],
        type: "plainObject",
        storageId: "savedBy",
        fieldId: "savedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Saved By",
        settings: {
            path: "savedBy.id"
        }
    },
    deletedBy: {
        id: "deletedBy",
        parents: [],
        type: "plainObject",
        storageId: "deletedBy",
        fieldId: "deletedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Deleted By",
        settings: {
            path: "deletedBy.id"
        }
    },
    restoredBy: {
        id: "restoredBy",
        parents: [],
        type: "plainObject",
        storageId: "restoredBy",
        fieldId: "restoredBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Restored By",
        settings: {
            path: "restoredBy.id"
        }
    },
    firstPublishedBy: {
        id: "firstPublishedBy",
        parents: [],
        type: "plainObject",
        storageId: "firstPublishedBy",
        fieldId: "firstPublishedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "First Published By",
        settings: {
            path: "firstPublishedBy.id"
        }
    },
    lastPublishedBy: {
        id: "lastPublishedBy",
        parents: [],
        type: "plainObject",
        storageId: "lastPublishedBy",
        fieldId: "lastPublishedBy",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Last Published By",
        settings: {
            path: "lastPublishedBy.id"
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
    wbyAco_location: {
        id: "wbyAco_location",
        parents: [],
        type: "object",
        storageId: "location",
        label: "Location",
        fieldId: "wbyAco_location",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        settings: {
            fields: [
                {
                    fieldId: "folderId",
                    id: "folderId",
                    label: "Folder ID",
                    settings: {
                        path: "location.folderId"
                    },
                    storageId: "folderId",
                    type: "text"
                }
            ]
        }
    },
    "wbyAco_location.folderId": {
        id: "folderId",
        parents: [
            {
                fieldId: "wbyAco_location",
                multipleValues: undefined
            }
        ],
        type: "text",
        label: "Folder ID",
        storageId: "folderId",
        fieldId: "folderId",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        settings: {
            path: "location.folderId"
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
    },
    wbyDeleted: {
        id: "wbyDeleted",
        parents: [],
        type: "boolean",
        storageId: "wbyDeleted",
        fieldId: "wbyDeleted",
        createPath: expect.any(Function),
        system: true,
        transform: expect.any(Function),
        label: "Deleted"
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
