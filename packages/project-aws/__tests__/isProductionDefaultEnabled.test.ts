import { describe, it, expect } from "vitest";
import { isProductionDefaultEnabled } from "~/pulumi/apps/extensions/isProductionDefaultEnabled.js";
import { DynamoDbPitr } from "~/pulumi/extensions/DynamoDbPitr.js";
import { FileManagerBucketVersioning } from "~/pulumi/extensions/FileManagerBucketVersioning.js";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

const PROD = true;
const NOT_PROD = false;

/* Minimal project config exposing just the one method the resolver calls. */
const projectConfigWith = (
    registered: Array<{ type: unknown; enabled: boolean }> = []
): IProjectConfigModel =>
    ({
        extensionsByType: (type: unknown) =>
            registered.filter(ext => ext.type === type).map(ext => ({ params: ext }))
    }) as unknown as IProjectConfigModel;

describe.each([
    ["Infra.DynamoDb.PITR", DynamoDbPitr],
    ["Infra.FileManager.BucketVersioning", FileManagerBucketVersioning]
])("isProductionDefaultEnabled with %s", (_, extension) => {
    it("should be on for production when the extension is not registered", () => {
        expect(isProductionDefaultEnabled(projectConfigWith(), extension, PROD)).toBe(true);
    });

    it("should be off outside production when the extension is not registered", () => {
        expect(isProductionDefaultEnabled(projectConfigWith(), extension, NOT_PROD)).toBe(false);
    });

    it("should honour enabled={false} on production", () => {
        // The upgrade script adds this to existing projects so a deploy does not change their infra.
        const config = projectConfigWith([{ type: extension, enabled: false }]);
        expect(isProductionDefaultEnabled(config, extension, PROD)).toBe(false);
    });

    it("should honour enabled={true} outside production", () => {
        const config = projectConfigWith([{ type: extension, enabled: true }]);
        expect(isProductionDefaultEnabled(config, extension, NOT_PROD)).toBe(true);
    });

    it("should use the last registered extension", () => {
        const config = projectConfigWith([
            { type: extension, enabled: false },
            { type: extension, enabled: true }
        ]);
        expect(isProductionDefaultEnabled(config, extension, PROD)).toBe(true);
    });
});

describe("isProductionDefaultEnabled", () => {
    it("should not read one extension's setting for the other", () => {
        const config = projectConfigWith([{ type: DynamoDbPitr, enabled: false }]);
        expect(isProductionDefaultEnabled(config, DynamoDbPitr, PROD)).toBe(false);
        expect(isProductionDefaultEnabled(config, FileManagerBucketVersioning, PROD)).toBe(true);
    });
});
