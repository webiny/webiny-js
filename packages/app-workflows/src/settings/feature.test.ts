import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowSettingsServicesFeature } from "./feature.js";
import { WorkflowSettingsGateway } from "./gateway/abstractions.js";
import { WorkflowSettingsRepository } from "./repository/abstractions.js";
import { GetWorkflowSettingsUseCase } from "./useCases/getWorkflowSettings/abstractions.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsUseCase } from "./useCases/updateWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";
import { WorkflowSettingsUseCases } from "./useCases/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    WorkflowSettingsServicesFeature.register(container);
    return container;
};

describe("WorkflowSettingsServicesFeature (R317, R354)", () => {
    it("registers the settings gateway and repository as singletons", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
        expect(container.resolve(WorkflowSettingsRepository)).toBeDefined();
        expect(container.resolve(WorkflowSettingsRepository)).toBe(
            container.resolve(WorkflowSettingsRepository)
        );
    });

    it("registers the two settings use cases transient", () => {
        const container = createContainer();

        const firstGet = container.resolve(GetWorkflowSettingsUseCase);
        const firstUpdate = container.resolve(UpdateWorkflowSettingsUseCase);
        expect(firstGet).toBeDefined();
        expect(firstUpdate).toBeDefined();
        expect(firstGet).not.toBe(container.resolve(GetWorkflowSettingsUseCase));
        expect(firstUpdate).not.toBe(container.resolve(UpdateWorkflowSettingsUseCase));
    });

    it("resolves each use case through its own feature", () => {
        const container = createContainer();

        expect(GetWorkflowSettingsFeature.resolve(container).useCase).toBeDefined();
        expect(UpdateWorkflowSettingsFeature.resolve(container).useCase).toBeDefined();
    });

    it("keeps the settings use-case bridge as a singleton until the cleanup (R356)", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowSettingsUseCases)).toBeDefined();
        expect(container.resolve(WorkflowSettingsUseCases)).toBe(
            container.resolve(WorkflowSettingsUseCases)
        );
    });

    it("runs GetWorkflowSettingsUseCase over the gateway with the expired entries", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                getSettings: {
                    data: { exclusions: [{ userId: "user-1", reason: null, endsOn: null }] },
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        const useCase = container.resolve(GetWorkflowSettingsUseCase);

        const settings = await useCase.execute();

        expect(settings).toEqual({
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        });
        expect(execute).toHaveBeenCalledTimes(1);
        const request = execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
    });
});
