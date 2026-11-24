import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { BackgroundTasksAwsFeature } from "~/BackgroundTasksAwsFeature.js";
import { BackgroundTaskInputHandler } from "@webiny/kernel-core";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { RequestContainer } from "@webiny/kernel-core";
import { AwsLambdaContext } from "@webiny/kernel-aws/abstractions/AwsLambdaContext.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";

const createNoopLogger = () => {
    const noop = () => {};
    return {
        info: noop,
        warn: noop,
        error: noop,
        debug: noop,
        trace: noop,
        fatal: noop
    } as unknown as Logger.Interface;
};

describe("BackgroundTasksAwsFeature", () => {
    it("should register BackgroundTaskLambdaHandler under BackgroundTaskInputHandler", () => {
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

        const handlers = container.resolveAll(BackgroundTaskInputHandler);
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
        container.registerInstance(Logger, createNoopLogger());

        BackgroundTasksAwsFeature.register(container);

        const services = container.resolveAll(TaskService);
        expect(services.length).toBeGreaterThanOrEqual(1);
    });
});
