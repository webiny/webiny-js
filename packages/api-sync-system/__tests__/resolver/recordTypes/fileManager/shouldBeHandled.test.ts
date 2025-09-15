import { describe, expect, it } from "vitest";
import { shouldBeHandled } from "~/resolver/recordTypes/fileManager/shouldBeHandled.js";
import type { IStorerAfterEachPluginCanHandleParams } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { createElasticsearchMockTable, createRegularMockTable } from "~tests/mocks/table.js";
import { createMockDeployment } from "~tests/mocks/deployments.js";

describe("shouldBeHandled", () => {
    it("should return true for fileManager record type", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas",
                modelId: "fmFile",
                values: {
                    "text@key": "filepath.jpg"
                }
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(true);
    });

    it("should return false for non-fileManager record type", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas"
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(false);
    });

    it("should return false for wrong table record", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "P",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas"
            },
            table: createElasticsearchMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(false);
    });

    it("should return false for non-latest record type", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "P",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas"
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(false);
    });

    it("should return false for record without values property", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas",
                modelId: "fmFile"
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(false);
    });

    it("should return false for record without key property", () => {
        const input: IStorerAfterEachPluginCanHandleParams = {
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas",
                modelId: "fmFile",
                values: {}
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        };
        const result = shouldBeHandled(input);

        expect(result).toBe(false);
    });
});
