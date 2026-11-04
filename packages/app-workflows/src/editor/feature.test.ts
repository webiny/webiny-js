import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { ReviewRepositoryFeature } from "~/review/repository/feature.js";
import { WorkflowEditorServicesFeature } from "./feature.js";
import { WorkflowEditorGateway } from "./gateway/abstractions.js";
import { WorkflowEditorRepository } from "./repository/abstractions.js";
import { ListWorkflowModelsUseCase } from "./useCases/listWorkflowModels/abstractions.js";
import { GetWorkflowUseCase } from "./useCases/getWorkflow/abstractions.js";
import { StoreWorkflowUseCase } from "./useCases/storeWorkflow/abstractions.js";
import { DeleteWorkflowUseCase } from "./useCases/deleteWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "./useCases/inspectRouting/abstractions.js";
import { FolderExistsUseCase } from "./useCases/folderExists/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/abstractions.js";

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    // The store and delete use cases clear the review workflow list (R350), so they need the review repository.
    ReviewRepositoryFeature.register(container);
    WorkflowEditorServicesFeature.register(container);
    return container;
};

describe("WorkflowEditorServicesFeature", () => {
    it("registers the routing gateway, the repository and the toasts as singletons", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowEditorGateway)).toBe(
            container.resolve(WorkflowEditorGateway)
        );
        expect(container.resolve(WorkflowEditorRepository)).toBe(
            container.resolve(WorkflowEditorRepository)
        );
        expect(container.resolve(WorkflowEditorToasts)).toBe(
            container.resolve(WorkflowEditorToasts)
        );
    });

    it("registers the six editor use cases transient", () => {
        const container = createContainer();

        expect(container.resolve(ListWorkflowModelsUseCase)).not.toBe(
            container.resolve(ListWorkflowModelsUseCase)
        );
        expect(container.resolve(GetWorkflowUseCase)).not.toBe(
            container.resolve(GetWorkflowUseCase)
        );
        expect(container.resolve(StoreWorkflowUseCase)).not.toBe(
            container.resolve(StoreWorkflowUseCase)
        );
        expect(container.resolve(DeleteWorkflowUseCase)).not.toBe(
            container.resolve(DeleteWorkflowUseCase)
        );
        expect(container.resolve(InspectRoutingUseCase)).not.toBe(
            container.resolve(InspectRoutingUseCase)
        );
        expect(container.resolve(FolderExistsUseCase)).not.toBe(
            container.resolve(FolderExistsUseCase)
        );
    });

    it("resolves only the toasts (R364)", () => {
        const container = createContainer();

        const services = WorkflowEditorServicesFeature.resolve(container);
        const keys = Object.keys(services);

        expect(keys).toEqual(["toasts"]);
        expect(services.toasts).toBe(container.resolve(WorkflowEditorToasts));
    });

    it("registers no configuration service: those are WorkflowConfigServicesFeature's (D187)", () => {
        const container = createContainer();

        expect(() => container.resolve(WorkflowConfigGateway)).toThrow("No registration found");
    });
});
