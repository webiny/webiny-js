import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowSettingsServicesFeature } from "./feature.js";
import { WorkflowSettingsGateway } from "./gateway/abstractions.js";
import { WorkflowSettingsUseCases } from "./useCases/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    return container;
};

describe("WorkflowSettingsServicesFeature (R317)", () => {
    it("registers the settings gateway and the settings use cases", () => {
        const container = createContainer();
        WorkflowSettingsServicesFeature.register(container);

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsUseCases)).toBeDefined();
    });

    it("registers them as singletons and resolves the use cases", () => {
        const container = createContainer();
        WorkflowSettingsServicesFeature.register(container);

        const first = WorkflowSettingsServicesFeature.resolve(container);
        const second = WorkflowSettingsServicesFeature.resolve(container);

        expect(first.settingsUseCases).toBe(second.settingsUseCases);
        expect(first.settingsUseCases).toBe(container.resolve(WorkflowSettingsUseCases));
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
    });

    it("runs the use cases over the gateway with the expired entries", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                getSettings: {
                    data: { exclusions: [{ userId: "user-1", reason: null, endsOn: null }] },
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowSettingsServicesFeature.register(container);
        const { settingsUseCases } = WorkflowSettingsServicesFeature.resolve(container);

        const settings = await settingsUseCases.getSettings();

        expect(settings).toEqual({
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        });
        expect(execute).toHaveBeenCalledTimes(1);
        const request = execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
    });
});
