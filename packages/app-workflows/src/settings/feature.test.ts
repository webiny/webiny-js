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

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
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
});
