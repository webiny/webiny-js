import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { ListWorkflowAiModelsFeature } from "~/api/features/WorkflowReview/ListWorkflowAiModels/feature.js";
import { ListWorkflowAiModelsUseCase } from "~/api/features/WorkflowReview/ListWorkflowAiModels/index.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings,
    type AiPowerUpsSettingsOptions
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";
import { createAiModel, registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
import {
    registerFakeWorkflowsAccess,
    type FakeWorkflowsAccessOptions
} from "~tests/__helpers/FakeWorkflowsAccess.js";

const MODELS: AiModel[] = [
    createAiModel("anthropic", "claude-a"),
    createAiModel("openai", "gpt-x"),
    createAiModel("anthropic", "claude-b"),
    createAiModel("anthropic", "claude-a"),
    createAiModel("google", "gem-1")
];

const SETTINGS: AiPowerUpsSettingsOptions = {
    connections: [
        createConnectionPreset({ id: "conn-anthropic", sdkName: "anthropic" }),
        // A connection without a stored key does not make its provider's models available.
        createConnectionPreset({ id: "conn-openai", sdkName: "openai", apiKeyEncrypted: "" })
    ]
};

interface SetupOptions {
    models?: AiModel[] | Error;
    settings?: AiPowerUpsSettingsOptions | Error;
    access?: FakeWorkflowsAccessOptions;
    /** Replaces the real `ConfiguredAiModelsService`, registered after it so it wins. */
    service?: ConfiguredAiModelsService.Interface;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();
    ConfiguredAiModelsFeature.register(container);
    ListWorkflowAiModelsFeature.register(container);
    const { error } = registerFakeLogger(container);
    registerFakeAi(container, options.models ?? MODELS);
    const settings = options.settings ?? SETTINGS;
    registerFakeAiPowerUpsSettings(
        container,
        settings instanceof Error ? settings : createAiPowerUpsSettings(settings)
    );
    registerFakeWorkflowsAccess(container, options.access);
    if (options.service) {
        container.registerInstance(ConfiguredAiModelsService, options.service);
    }
    return {
        container,
        logged: error,
        listAiModels: container.resolve(ListWorkflowAiModelsUseCase)
    };
};

describe("ListWorkflowAiModelsUseCase (R169, R176)", () => {
    it("lists the models of providers with a connection that has a key, in provider order, once each", async () => {
        const { listAiModels } = setup();

        const result = await listAiModels.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([
            {
                id: "anthropic/claude-a",
                name: "claude-a name",
                providerId: "anthropic",
                providerName: "anthropic provider"
            },
            {
                id: "anthropic/claude-b",
                name: "claude-b name",
                providerId: "anthropic",
                providerName: "anthropic provider"
            }
        ]);
        expect(Object.keys(result.value?.[0] ?? {})).toEqual([
            "id",
            "name",
            "providerId",
            "providerName"
        ]);
    });

    it("lists nothing when no connection has a key", async () => {
        const { listAiModels } = setup({ settings: { connections: [] } });

        const result = await listAiModels.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([]);
    });

    it("returns exactly the rows of ConfiguredAiModelsService.list(), in the same order (Review Focus 6)", async () => {
        const { container, listAiModels } = setup();

        const rows = await listAiModels.execute();
        const service = await container.resolve(ConfiguredAiModelsService).list();

        expect(rows.value).toEqual(service.value);
    });

    it("allows a full-access permission set", async () => {
        const { listAiModels } = setup({ access: { canEdit: true } });

        expect((await listAiModels.execute()).isOk()).toBe(true);
    });

    it("refuses a user without editor, before reading any model", async () => {
        const calls: string[] = [];
        const { listAiModels } = setup({
            access: { canEdit: false },
            service: {
                list: async () => {
                    calls.push("list");
                    return Result.ok([]);
                },
                findConnection: async () => Result.ok(null)
            }
        });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/NotAuthorized");
        expect(result.error?.message).toBe("You are not allowed to list AI models.");
        expect(result.error?.data).toEqual({ action: "list AI models" });
        expect(calls).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const { listAiModels } = setup({ access: { signedIn: false } });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/NotAuthenticated");
    });

    it("returns a fixed-text persistence error and logs the raw error once when the permission check throws (R87)", async () => {
        const { listAiModels, logged } = setup({
            access: { canEdit: new Error("Permissions are down.") }
        });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/Workflow/Persistence");
        // Persistence errors send a fixed text; the use case's text is the raw cause (R146).
        expect(result.error?.message).toBe("The workflow could not be read or saved.");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Could not list the AI models."
        );
        expect(result.error?.message).not.toContain("Permissions are down.");
        expect(logged).toHaveBeenCalledTimes(1);
        expect(logged.mock.calls[0][0].error.message).toBe("Permissions are down.");
        expect(logged.mock.calls[0][1]).toBe("Could not list the AI models.");
    });

    it("shows the service's fixed text for a failed settings read and logs once in total, the service's", async () => {
        const { listAiModels, logged } = setup({ settings: new Error("settings table is down") });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error?.message).toBe("The workflow could not be read or saved.");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Failed to load AI Power-Ups settings."
        );
        expect(result.error?.message).not.toContain("settings table is down");
        // The service logged the raw failure once; this use case must not log it again.
        expect(logged).toHaveBeenCalledTimes(1);
    });

    it("shows the service's fixed text when the provider list throws and logs once in total, the service's", async () => {
        const { listAiModels, logged } = setup({
            models: new Error("provider is down: key sk-123")
        });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error?.message).toBe("The workflow could not be read or saved.");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Failed to list the configured AI models."
        );
        expect(result.error?.message).not.toContain("sk-123");
        expect(logged).toHaveBeenCalledTimes(1);
    });

    it("returns a fixed-text persistence error and logs the raw error once when the service itself throws (R87)", async () => {
        const { listAiModels, logged } = setup({
            service: {
                list: async () => {
                    throw new Error("The service is down.");
                },
                findConnection: async () => Result.ok(null)
            }
        });

        const result = await listAiModels.execute();

        expect(result.error?.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error?.message).toBe("The workflow could not be read or saved.");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Could not list the AI models."
        );
        expect(result.error?.message).not.toContain("The service is down.");
        expect(logged).toHaveBeenCalledTimes(1);
        expect(logged.mock.calls[0][0].error.message).toBe("The service is down.");
    });
});
