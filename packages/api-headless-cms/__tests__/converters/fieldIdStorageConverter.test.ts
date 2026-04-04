import { beforeEach, describe, expect, it } from "vitest";
import { createModel, createRawEntry, createStoredEntry } from "./mocks/fieldIdStorageConverter.js";
import { createValueKeyFromStorageConverter } from "~/utils/converters/valueKeyFromStorageConverter.js";
import { createValueKeyToStorageConverter } from "~/utils/converters/valueKeyToStorageConverter.js";
import type { CmsModelObjectField } from "~/types/index.js";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

describe("field id storage converter", () => {
    let plugins: PluginsContainer;
    let fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;

    beforeEach(async () => {
        const { handler, tenant } = useHandler({});
        const context = await handler({
            path: "/cms/manage",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });
        plugins = context.plugins;
        const { CmsModelFieldToGraphQLRegistry } = await import("~/features/graphql/index.js");
        fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);
    });

    it("should convert field value paths to storage ones", async () => {
        const model = createModel();

        const entry = createRawEntry();

        expect(model).toMatchObject({
            modelId: model.modelId
        });
        expect(entry).toMatchObject({
            id: "someEntryId#0001",
            values: {
                name: "John Doe"
            }
        });

        const convertToStorage = createValueKeyToStorageConverter({
            model,
            plugins,
            fieldRegistry
        });

        const result = convertToStorage({
            fields: model.fields,
            values: entry.values
        });
        /**
         * The createStoredEntry() returns exactly what we are expecting the converter to produce.
         * This method was created manually, so there are no automations, and possible errors.
         */
        expect(result).toEqual(createStoredEntry().values);
        /**
         * Make sure dynamic zone is converted properly.
         */
        expect(result).toMatchObject({
            "dynamicZone@dynamicZoneArrayId": [
                {
                    _templateId: "dzTemplateArray1",
                    "text@dzTextId": "Dynamic zone array title",
                    "rich-text@dzArrayRichTextId": "My Rich Text in DZ",
                    "rich-text@dzArrayRichTextMultipleId": [
                        "My Rich Text Multiple 1",
                        "My Rich Text Multiple 2"
                    ],
                    "object@dzObjectArrayId": [
                        {
                            "text@titleInDzObjectArrayId": "Dynamic zone object array title"
                        }
                    ],
                    "object@dzObjectId": {
                        "text@titleInDzObjectId": "Dynamic zone object title"
                    }
                }
            ],
            "dynamicZone@dynamicZoneObjectId": {
                _templateId: "dzTemplateObject1",
                "text@dzTextId": "Dynamic zone object title",
                "rich-text@dzObjectRichTextId": "My Rich Text in DZ",
                "rich-text@dzObjectRichTextMultipleId": [
                    "My Rich Text Multiple 1",
                    "My Rich Text Multiple 2"
                ],
                "object@dzObjectId": {
                    "text@titleInDzObjectId": "Dynamic zone object title"
                }
            }
        });
        /**
         * Then we need to convert that same data back to regular object.
         */
        const convertFromStorage = createValueKeyFromStorageConverter({
            model,
            plugins,
            fieldRegistry
        });

        const fromStorageResult = convertFromStorage({
            fields: model.fields,
            values: result
        });

        expect(fromStorageResult).toEqual(entry.values);
    });

    it("should convert field value paths from storage ones", async () => {
        const model = createModel();

        const entry = createStoredEntry();

        expect(model).toMatchObject({
            modelId: model.modelId
        });

        expect(entry).toMatchObject({
            id: "someEntryId#0001",
            values: {
                "text@nameId": "John Doe"
            }
        });

        const convert = createValueKeyFromStorageConverter({
            model,
            plugins,
            fieldRegistry
        });

        const result = convert({
            fields: model.fields,
            values: entry.values
        });
        /**
         * The createStoredEntry() returns exactly what we are expecting the converter to produce.
         * This method was created manually, so there are no automations, and possible errors.
         */
        expect(result).toEqual(createRawEntry().values);
    });

    it("should convert object + dynamic zone + rich text", async () => {
        const baseModel = createModel();

        /**
         * First we need to extract the myObjectField + dz inside it so we do not have much clutter.
         */
        const baseMyObjectField = baseModel.fields.find((field): field is CmsModelObjectField => {
            return field.fieldId === "myObject";
        })!;
        const myObjectField = {
            ...baseMyObjectField,
            settings: {
                ...baseMyObjectField.settings,
                fields: baseMyObjectField.settings.fields.filter(field => {
                    return field.fieldId === "myObjectDz";
                })
            }
        };

        const model = {
            ...baseModel,
            fields: [myObjectField]
        };

        const baseEntry = createRawEntry();

        const entry = {
            ...baseEntry,
            values: {
                myObject: {
                    myObjectDz: {
                        ...baseEntry.values.myObject.myObjectDz
                    }
                }
            }
        };

        const convertToStorage = createValueKeyToStorageConverter({
            model,
            plugins,
            fieldRegistry
        });

        const result = convertToStorage({
            fields: model.fields,
            values: entry.values
        });
        /**
         * The createStoredEntry() returns exactly what we are expecting the converter to produce.
         * This method was created manually, so there are no automations, and possible errors.
         */
        expect(result).toEqual({
            "object@myObjectId": {
                "dynamicZone@myObjectDzId": {
                    _templateId: "myObjectDzTemplate1",
                    "rich-text@myObjectDzRichTextId": "My Rich Text in My Object DZ",
                    "rich-text@myObjectDzRichTextMultipleId": [
                        "My Rich Text Multiple 1",
                        "My Rich Text Multiple 2"
                    ]
                }
            }
        });
    });
});
