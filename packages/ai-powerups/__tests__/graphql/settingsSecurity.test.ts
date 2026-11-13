import { describe, test, expect } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GetDecryptedSettingsUseCase } from "~/api/features/GetDecryptedSettings/index.js";
import { useContext, useGraphQLHandler, TEST_MODEL_ID } from "~tests/helpers/useGraphQLHandler.js";

const API_KEY = "sk-test-1234567890abcdef";

const PROVIDERS_INPUT = {
    providers: {
        presets: [{ id: "default", name: "Default", model: TEST_MODEL_ID, apiKey: API_KEY }]
    }
};

const NOT_AUTHORIZED = { code: "NOT_AUTHORIZED", message: "Not authorized!" };

const WITHOUT_FULL_ACCESS: Array<[string, SecurityPermission[]]> = [
    ["no permissions", []],
    ["a scoped wildcard", [{ name: "cms.*" }]]
];

describe("AI Power-Ups settings security", () => {
    describe("updateSettings", () => {
        test.each(WITHOUT_FULL_ACCESS)("is refused with %s", async (_, permissions) => {
            const { updateSettings } = useGraphQLHandler({ permissions });
            const response = await updateSettings(PROVIDERS_INPUT);
            expect(response.data.aiPowerUps.updateSettings).toEqual({
                data: null,
                error: NOT_AUTHORIZED
            });
        });

        test("is refused for anonymous callers", async () => {
            const { updateSettings } = useGraphQLHandler({ identity: null, permissions: [] });
            const response = await updateSettings(PROVIDERS_INPUT);
            expect(response.data.aiPowerUps.updateSettings).toEqual({
                data: null,
                error: NOT_AUTHORIZED
            });
        });

        test("does not change the stored settings when refused", async () => {
            const { getSettings } = useGraphQLHandler();
            const before = await getSettings();
            expect(before.data.aiPowerUps.getSettings).toBeTruthy();

            const { updateSettings } = useGraphQLHandler({ permissions: [] });
            const response = await updateSettings(PROVIDERS_INPUT);
            expect(response.data.aiPowerUps.updateSettings.error).toEqual(NOT_AUTHORIZED);

            const after = await getSettings();
            expect(after.data.aiPowerUps.getSettings).toEqual(before.data.aiPowerUps.getSettings);
        });

        test("passes with full access and masks the stored key", async () => {
            const { updateSettings } = useGraphQLHandler();
            const response = await updateSettings(PROVIDERS_INPUT);
            const result = response.data.aiPowerUps.updateSettings;
            expect(result.error).toBeNull();

            const maskedKey = result.data.providers.presets[0].apiKey;
            expect(maskedKey).not.toBe(API_KEY);
            expect(maskedKey.startsWith(API_KEY.slice(0, 8))).toBe(true);
            expect(maskedKey.endsWith(API_KEY.slice(-4))).toBe(true);
        });
    });

    describe("getSettings", () => {
        test("is refused for anonymous callers", async () => {
            const { getSettings } = useGraphQLHandler({ identity: null, permissions: [] });
            const response = await getSettings();
            expect(response.data.aiPowerUps.getSettings).toBeNull();
            expect(response.errors[0].message).toBe(NOT_AUTHORIZED.message);
        });

        test.each(WITHOUT_FULL_ACCESS)(
            "hides provider keys but keeps presets with %s",
            async (_, permissions) => {
                const { updateSettings } = useGraphQLHandler();
                const updateResponse = await updateSettings(PROVIDERS_INPUT);
                expect(updateResponse.data.aiPowerUps.updateSettings.error).toBeNull();

                const { getSettings } = useGraphQLHandler({ permissions });
                const response = await getSettings();
                const preset = response.data.aiPowerUps.getSettings.providers.presets[0];
                expect(preset).toMatchObject({ id: "default", name: "Default", apiKey: null });
            }
        );

        test("returns the masked key with full access", async () => {
            const { updateSettings, getSettings } = useGraphQLHandler();
            await updateSettings(PROVIDERS_INPUT);

            const response = await getSettings();
            const preset = response.data.aiPowerUps.getSettings.providers.presets[0];
            expect(preset.apiKey).not.toBeNull();
            expect(preset.apiKey).not.toBe(API_KEY);
        });
    });

    describe("listModels", () => {
        test("is refused for anonymous callers", async () => {
            const { listModels } = useGraphQLHandler({ identity: null, permissions: [] });
            const response = await listModels();
            // `listModels` is non-null, so the error nulls the whole `aiPowerUps` object.
            expect(response.data.aiPowerUps).toBeNull();
            expect(response.errors[0].message).toBe(NOT_AUTHORIZED.message);
        });

        test("passes for logged-in users", async () => {
            const { listModels } = useGraphQLHandler({ permissions: [] });
            const response = await listModels();
            expect(response.data.aiPowerUps.listModels).toEqual([
                { providerId: "test", modelId: "model" }
            ]);
        });
    });

    describe("generatePageContent", () => {
        test("is refused for anonymous callers and queues no task", async () => {
            const { generatePageContent, taskService } = useGraphQLHandler({
                identity: null,
                permissions: []
            });
            const response = await generatePageContent();
            // `generatePageContent` is non-null, so the error nulls the whole `aiPowerUps` object.
            expect(response.data.aiPowerUps).toBeNull();
            expect(response.errors[0].message).toBe(NOT_AUTHORIZED.message);
            expect(taskService.triggered).toHaveLength(0);
        });

        test.each<[string, SecurityPermission[]]>([
            ["no permissions", []],
            ["read-only pages", [{ name: "wb.page", rwd: "r" }]],
            ["another app", [{ name: "cms.*" }]]
        ])("is refused with %s and queues no task", async (_, permissions) => {
            const { generatePageContent, taskService } = useGraphQLHandler({ permissions });
            const response = await generatePageContent();
            expect(response.data.aiPowerUps).toBeNull();
            expect(response.errors[0].message).toBe(NOT_AUTHORIZED.message);
            expect(taskService.triggered).toHaveLength(0);
        });

        test.each<[string, SecurityPermission[]]>([
            ["page write", [{ name: "wb.page", rwd: "rw" }]],
            ["page access without rwd", [{ name: "wb.page" }]],
            ["website builder wildcard", [{ name: "wb.*" }]],
            ["full access", [{ name: "*" }]]
        ])("queues a task with %s", async (_, permissions) => {
            const { generatePageContent, taskService } = useGraphQLHandler({ permissions });
            const response = await generatePageContent();
            expect(response.data.aiPowerUps.generatePageContent).toEqual({ id: "task-1" });
            expect(taskService.triggered).toHaveLength(1);
        });
    });

    describe("GetDecryptedSettingsUseCase", () => {
        test("returns the decrypted key to a logged-in identity without full access", async () => {
            const { updateSettings } = useGraphQLHandler();
            await updateSettings(PROVIDERS_INPUT);

            const context = await useContext({ permissions: [] });
            const result = await context.container.resolve(GetDecryptedSettingsUseCase).execute();
            expect(result.isOk()).toBe(true);
            expect(result.value.providers.presets[0].apiKey).toBe(API_KEY);
        });

        test("is refused for anonymous callers", async () => {
            const context = await useContext({ identity: null, permissions: [] });
            const result = await context.container.resolve(GetDecryptedSettingsUseCase).execute();
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("NOT_AUTHORIZED");
        });
    });
});
