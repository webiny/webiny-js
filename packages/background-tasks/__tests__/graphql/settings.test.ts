import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { BACKGROUND_TASK_DEFAULT_RETENTION_DAYS } from "~/api/domain/constants";

describe("graphql - settings", () => {
    const handler = useGraphQLHandler();

    it("should return default settings when none have been saved", async () => {
        const result = await handler.getSettings();

        expect(result.data.backgroundTasks.getSettings).toEqual({
            data: {
                retentionDays: BACKGROUND_TASK_DEFAULT_RETENTION_DAYS
            },
            error: null
        });
    });

    it("should update retention days", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: 30 }
        });

        expect(result.data.backgroundTasks.updateSettings).toEqual({
            data: {
                retentionDays: 30
            },
            error: null
        });
    });

    it("should persist updated settings across reads", async () => {
        await handler.updateSettings({
            input: { retentionDays: 180 }
        });

        const result = await handler.getSettings();

        expect(result.data.backgroundTasks.getSettings).toEqual({
            data: {
                retentionDays: 180
            },
            error: null
        });
    });

    it("should allow setting retention to 0 (never delete)", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: 0 }
        });

        expect(result.data.backgroundTasks.updateSettings).toEqual({
            data: {
                retentionDays: 0
            },
            error: null
        });
    });

    it("should allow setting retention to the maximum (3650 days)", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: 3650 }
        });

        expect(result.data.backgroundTasks.updateSettings).toEqual({
            data: {
                retentionDays: 3650
            },
            error: null
        });
    });

    it("should reject negative retention days", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: -1 }
        });

        expect(result.data.backgroundTasks.updateSettings.data).toBeNull();
        expect(result.data.backgroundTasks.updateSettings.error).toMatchObject({
            code: "BackgroundTasks/ValidationError",
            message: "Validation failed."
        });
    });

    it("should reject retention days exceeding the maximum", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: 3651 }
        });

        expect(result.data.backgroundTasks.updateSettings.data).toBeNull();
        expect(result.data.backgroundTasks.updateSettings.error).toMatchObject({
            code: "BackgroundTasks/ValidationError",
            message: "Validation failed."
        });
    });

    it("should reject non-integer retention days at the GraphQL layer", async () => {
        const result = await handler.updateSettings({
            input: { retentionDays: 30.5 }
        });

        /* GraphQL Int type rejects floats before the resolver runs. */
        expect(result.data).toBeUndefined();
    });
});
