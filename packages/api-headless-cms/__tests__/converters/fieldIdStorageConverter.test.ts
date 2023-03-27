import { createRawEntry, createStoredEntry, createModel } from "./mocks/fieldIdStorageConverter";
import { PluginsContainer } from "@webiny/plugins";
import { createFieldConverters } from "~/fieldConverters";
import {
    createValueKeyToStorageConverter,
    createValueKeyFromStorageConverter
} from "~/utils/converters/valueKeyStorageConverter";
import { createGraphQLFields } from "~/graphqlFields";
import { createObjectFieldWithDynamicZone } from "~tests/converters/mocks/fields/objectField";

jest.setTimeout(10000);

const plugins = new PluginsContainer([...createFieldConverters(), ...createGraphQLFields()]);

describe("field id storage converter", () => {
    /**
     * Conversion feature is enabled.
     */
    it("should convert field value paths to storage ones", () => {
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
            plugins
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
         * Then we need to convert that same data back to regular object.
         */
        const convertFromStorage = createValueKeyFromStorageConverter({
            model,
            plugins
        });

        const fromStorageResult = convertFromStorage({
            fields: model.fields,
            values: result
        });

        expect(fromStorageResult).toEqual(entry.values);
    });

    it("should convert field value paths from storage ones", () => {
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
            plugins
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
    /**
     * Conversion feature is not enabled.
     */
    it("should not convert field value paths to storage ones", () => {
        const model = createModel({
            webinyVersion: "disable"
        });

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

        const convert = createValueKeyToStorageConverter({
            model,
            plugins
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
    it("should not convert field value paths from storage ones", () => {
        const model = createModel({
            webinyVersion: "disable"
        });

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
            plugins
        });

        const result = convert({
            fields: model.fields,
            values: entry.values
        });
        /**
         * The createStoredEntry() returns exactly what we are expecting the converter to produce.
         * This method was created manually, so there are no automations, and possible errors.
         */
        expect(result).toEqual(createStoredEntry().values);
    });

    it(`should convert object with dynamic zone and text field`, () => {
        const model = createModel({
            fields: [createObjectFieldWithDynamicZone()]
        });

        const rawEntryValues = {
            objectWithDynamicZone: {
                name: "Name of the entry",
                dynamicZoneObject: {
                    title: "Some randomly typed text",
                    _templateId: "dynamicZoneTitleTemplate"
                }
            }
        };

        const entry = createRawEntry({
            ...rawEntryValues
        });

        expect(model).toMatchObject({
            modelId: model.modelId
        });
        expect(entry).toMatchObject({
            id: "someEntryId#0001",
            values: {
                ...rawEntryValues
            }
        });

        const convertToStorage = createValueKeyToStorageConverter({
            model,
            plugins
        });

        const result = convertToStorage({
            fields: model.fields,
            values: entry.values
        });

        const storedEntryValues = {
            "object@objectWithDynamicZoneId": {
                "text@nameId": "Name of the entry",
                "dynamicZone@dynamicZoneObjectId": {
                    "text@titleId": "Some randomly typed text",
                    _templateId: "dynamicZoneTitleTemplate"
                }
            }
        };

        expect(result).toEqual({
            ...storedEntryValues
        });

        const convertFromStorage = createValueKeyFromStorageConverter({
            model,
            plugins
        });

        const fromStorageResult = convertFromStorage({
            fields: model.fields,
            values: result
        });

        expect(fromStorageResult).toEqual(entry.values);
    });
});
