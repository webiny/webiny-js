import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { BackgroundTasksAwsFeature } from "~/BackgroundTasksAwsFeature.js";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/BackgroundTaskEventHandler.js";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { AwsLambdaContext } from "@webiny/event-handler-aws/abstractions/AwsLambdaContext.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";

describe("BackgroundTasksAwsFeature", () => {
    it("should register BackgroundTaskLambdaHandler under BackgroundTaskEventHandler", () => {
        const container = new Container();

        /* Provide required dependencies so DI resolution doesn't fail. */
        container.registerInstance(RequestContainer, container);
        container.registerInstance(AwsLambdaContext, {
            isSet: () => false,
            get: () => ({ getRemainingTimeInMillis: () => 0 })
        });
        container.registerInstance(TenantContext, {
            getTenant: () => ({ id: "root" }),
            setTenant: () => {}
        });

        BackgroundTasksAwsFeature.register(container);

        const handlers = container.resolveAll(BackgroundTaskEventHandler);
        expect(handlers.length).toBeGreaterThanOrEqual(1);
    });

    it("should register StepFunctionService under TaskService", () => {
        const container = new Container();

        container.registerInstance(RequestContainer, container);
        container.registerInstance(AwsLambdaContext, {
            isSet: () => false,
            get: () => ({ getRemainingTimeInMillis: () => 0 })
        });
        container.registerInstance(TenantContext, {
            getTenant: () => ({ id: "root" }),
            setTenant: () => {}
        });

        BackgroundTasksAwsFeature.register(container);

        const services = container.resolveAll(TaskService);
        expect(services.length).toBeGreaterThanOrEqual(1);
    });
});
