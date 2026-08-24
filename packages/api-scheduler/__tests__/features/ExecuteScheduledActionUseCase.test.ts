import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandlerImpl } from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionHandler, ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULE_MODEL_ID } from "~/constants.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { SchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";

describe("ExecuteScheduledActionUseCase - non-root tenant", () => {
    const targetId = "target-id#0001";
    const namespace = PublishTestEntryActionHandlerImpl.name;
    const actionType = SCHEDULED_ACTION_PUBLISH;

    let context: CmsContext;

    beforeEach(async () => {
        const mockedSchedulerClient = mockClient(SchedulerClient);
        mockedSchedulerClient.resolves({});
        const contextHandler = useHandler({
            getScheduleClient: () => createMockScheduleClient()
        });
        context = await contextHandler.handler();
        context.container.register(NamespaceHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    const setupWebinyTenant = async () => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);
        const getTenantById = context.container.resolve(GetTenantByIdUseCase);
        const getModel = context.container.resolve(GetModelUseCase);

        const tenantResult = await getTenantById.execute("webiny");
        expect(tenantResult.isOk()).toBe(true);

        return {
            tenantContext,
            identityContext,
            getModel,
            webinyTenant: tenantResult.value
        };
    };

    const reloadModelForCurrentTenant = async (
        identityContext: IdentityContext.Interface,
        getModel: GetModelUseCase.Interface
    ) => {
        await identityContext.withoutAuthorization(async () => {
            const modelResult = await getModel.execute(SCHEDULE_MODEL_ID);
            expect(modelResult.isOk()).toBe(true);
            context.container.registerInstance(ScheduledActionModel, modelResult.value);
        });
    };

    const scheduleInWebinyTenant = async (
        tenantContext: TenantContext.Interface,
        identityContext: IdentityContext.Interface,
        getModel: GetModelUseCase.Interface,
        webinyTenant: any
    ) => {
        await tenantContext.withTenant(webinyTenant, async () => {
            await reloadModelForCurrentTenant(identityContext, getModel);

            const scheduleAction = context.container.resolve(ScheduleActionUseCase);
            const scheduleResult = await scheduleAction.execute({
                namespace,
                actionType,
                targetId,
                scheduleFor: new Date(Date.now() + 1000000)
            });
            expect(scheduleResult.isFail()).toBe(false);
        });
    };

    it("should execute scheduled action in non-root tenant when model is reloaded", async () => {
        const { tenantContext, identityContext, getModel, webinyTenant } = await setupWebinyTenant();
        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        await scheduleInWebinyTenant(tenantContext, identityContext, getModel, webinyTenant);

        const mockHandler = {
            canHandle: vi.fn(() => true),
            handle: vi.fn(async () => {})
        };
        context.container.registerInstance(ScheduledActionHandler, mockHandler);

        await tenantContext.withTenant(webinyTenant, async () => {
            await reloadModelForCurrentTenant(identityContext, getModel);

            const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);
            const result = await executeScheduledAction.execute({
                id: scheduleId,
                namespace,
                tenant: "webiny"
            });

            expect(result.isFail()).toBe(false);
            expect(mockHandler.handle).toHaveBeenCalledTimes(1);

            const getScheduledAction = context.container.resolve(GetScheduledActionUseCase);
            const getResult = await getScheduledAction.execute({ id: scheduleId, namespace });
            expect(getResult.isFail()).toBe(true);
            expect(getResult.error.code).toBe("Scheduler/ScheduledAction/NotFound");
        });
    });

    it("should store error on handler failure in non-root tenant", async () => {
        const { tenantContext, identityContext, getModel, webinyTenant } = await setupWebinyTenant();
        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        await scheduleInWebinyTenant(tenantContext, identityContext, getModel, webinyTenant);

        context.container.registerInstance(ScheduledActionHandler, {
            canHandle: () => true,
            async handle(): Promise<void> {
                throw new Error("Handler execution failed");
            }
        });

        await tenantContext.withTenant(webinyTenant, async () => {
            await reloadModelForCurrentTenant(identityContext, getModel);

            const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);
            const result = await executeScheduledAction.execute({
                id: scheduleId,
                namespace,
                tenant: "webiny"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Scheduler/Execution/Failed");

            const getScheduledAction = context.container.resolve(GetScheduledActionUseCase);
            const getResult = await getScheduledAction.execute({ id: scheduleId, namespace });
            expect(getResult.isFail()).toBe(false);
            expect(getResult.value.error).toContain("Handler execution failed");
        });
    });
});
