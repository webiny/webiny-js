import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowEditorServicesFeature } from "./feature.js";
import { WorkflowConfigGateway } from "./gateway/WorkflowConfigGateway.js";
import { WorkflowConfigUseCases } from "./useCases/WorkflowConfigUseCases.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("WorkflowEditorServicesFeature", () => {
    it("registers the config gateway, the config use cases and the toasts", () => {
        const container = createContainer();
        WorkflowEditorServicesFeature.register(container);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
        expect(container.resolve(WorkflowEditorToasts)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
        const container = createContainer();
        WorkflowEditorServicesFeature.register(container);

        const first = WorkflowEditorServicesFeature.resolve(container);
        const second = WorkflowEditorServicesFeature.resolve(container);

        expect(first.configUseCases).toBe(second.configUseCases);
        expect(first.toasts).toBe(second.toasts);
        expect(first.configUseCases).toBe(container.resolve(WorkflowConfigUseCases));
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
    });

    it("runs the config use cases over the shared gateway", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                listNotificationTransports: {
                    data: [{ id: "e-mail", title: "E-mail", description: null }],
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowEditorServicesFeature.register(container);
        const { configUseCases } = WorkflowEditorServicesFeature.resolve(container);

        const transports = await configUseCases.listNotificationTransports();

        expect(transports).toEqual([{ id: "e-mail", title: "E-mail", description: null }]);
        expect(execute).toHaveBeenCalledTimes(1);
    });
});
