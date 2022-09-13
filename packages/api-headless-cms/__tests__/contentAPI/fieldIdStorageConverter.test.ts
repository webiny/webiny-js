import { createRawEntry, createStoredEntry, createModel } from "./mocks/fieldIdStorageConverter";
import { PluginsContainer } from "@webiny/plugins";
import { createFieldConverters } from "~/fieldConverters";
import {
    createValueKeyToStorageConverter,
    createValueKeyFromStorageConverter
} from "~/utils/converters/valueKeyStorageConverter";
import { createGraphQLFields } from "~/graphqlFields";

const plugins = new PluginsContainer([...createFieldConverters(), ...createGraphQLFields()]);

describe("field id storage converter", () => {
    it("should convert field value paths to storage ones", () => {
        const model = createModel();

        const entry = createRawEntry();
        /**
         * TODO remove checks
         */
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
            plugins,
            model
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

    it("should convert field value paths from storage ones", () => {
        const model = createModel();

        const entry = createStoredEntry();
        /**
         * TODO remove checks
         */
        expect(model).toMatchObject({
            modelId: model.modelId
        });
        expect(entry).toMatchObject({
            id: "someEntryId#0001",
            values: {
                name: "John Doe"
            }
        });

        const convert = createValueKeyFromStorageConverter({
            plugins,
            model
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
});
