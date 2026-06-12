import { beforeEach, describe, expect, it } from "vitest";
import { RawEventHandler } from "@webiny/handler-aws/raw/index.js";
import {
    createScheduledActionEventHandler,
    type IScheduledActionEvent
} from "~/createEventHandler.js";
import { registry } from "@webiny/handler-aws/registry.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER, SCHEDULED_ACTION_PUBLISH } from "~/constants.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { useHandler } from "./__mocks/handler/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";

describe("Scheduler Event Handler", () => {
    const lambdaContext = {} as LambdaContext;

    const namespace = PublishTestEntryActionHandlerImpl.name;

    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(PublishTestEntryActionHandler);
        context.container.register(NamespaceHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should trigger handle an event which matches scheduled event", async () => {
        const eventHandler = createScheduledActionEventHandler();

        expect(eventHandler).toBeInstanceOf(RawEventHandler);

        const event: IScheduledActionEvent = {
            [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                id: ScheduledActionId.from({
                    namespace,
                    actionType: SCHEDULED_ACTION_PUBLISH,
                    targetId: "target-id#0001"
                }),
                namespace,
                scheduleFor: new Date().toISOString()
            }
        };
        const sourceHandler = registry.getHandler(event, lambdaContext);

        expect(sourceHandler).toMatchObject({
            name: "handler-aws-event-bridge-scheduled-cms-action-event"
        });
        expect(sourceHandler.canUse(event, lambdaContext)).toBe(true);
    });

    it("should run handle action", async () => {
        const eventHandler = createScheduledActionEventHandler();
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);

        const scheduleFor = new Date(new Date().getTime() + 5 * 60 * 1000);
        const createResult = await scheduleActionUseCase.execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor,
            immediately: false
        });

        expect(createResult.isOk()).toBeTrue();
        expect(createResult.value).toEqual({
            actionType: SCHEDULED_ACTION_PUBLISH,
            error: undefined,
            id: expect.stringMatching("wby-schedule-"),
            namespace: PublishTestEntryActionHandlerImpl.name,
            payload: {
                actionType: SCHEDULED_ACTION_PUBLISH,
                namespace: "Test/SomeCustomEntry",
                scheduleId: expect.stringMatching("wby-schedule-"),
                targetId: "target-id#0001",
                title: "Fetched title from handler",
                something: true
            },
            scheduledBy: {
                displayName: "John Doe",
                id: "id-12345678",
                type: "admin"
            },
            scheduledFor: scheduleFor,
            targetId: "target-id#0001",
            tenant: "root",
            title: "Fetched title from handler"
        });
        /**
         * Use anonymous identity to start the event handler - this way we make sure that the action handler
         * uses the identity stored on the scheduled action itself.
         */
        const identityContext = context.container.resolve(IdentityContext);
        identityContext.setIdentity(undefined);

        const id = createResult.value.id;

        const result = await eventHandler.cb({
            payload: {
                [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                    id,
                    namespace,
                    scheduleFor: new Date(new Date().getTime() + 3 * 60 * 1000).toISOString()
                }
            },
            context,
            request: context.request,
            reply: context.reply
        });
        expect(result).toEqual({
            success: true
        });
    });

    it("should execute a scheduled action created on a non-root tenant", async () => {
        const tenantContext = context.container.resolve(TenantContext);
        const getTenantById = context.container.resolve(GetTenantByIdUseCase);

        const tenantResult = await getTenantById.execute("webiny");
        expect(tenantResult.isOk()).toBeTrue();
        const webinyTenant = tenantResult.value;

        /* Schedule action while on the "webiny" tenant. */
        const scheduleFor = new Date(Date.now() + 5 * 60 * 1000);
        const createResult = await tenantContext.withTenant(webinyTenant, async () => {
            const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);
            return scheduleActionUseCase.execute({
                namespace: PublishTestEntryActionHandlerImpl.name,
                actionType: SCHEDULED_ACTION_PUBLISH,
                targetId: "target-id#0002",
                scheduleFor,
                immediately: false
            });
        });

        expect(createResult.isOk()).toBeTrue();
        expect(createResult.value.tenant).toBe("webiny");

        /*
         * Create a fresh context for the event handler execution.
         * In production, the EventBridge event triggers a separate Lambda invocation
         * with its own context and fresh DataLoader caches. We simulate that here.
         */
        const executionHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const executionContext = await executionHandler.handler();
        executionContext.container.register(PublishTestEntryActionHandler);
        executionContext.container.register(NamespaceHandler);
        executionContext.container.registerInstance(SchedulerService, new VoidSchedulerService());

        const executionTenantContext = executionContext.container.resolve(TenantContext);
        expect(executionTenantContext.getTenant().id).toBe("root");

        const identityContext = executionContext.container.resolve(IdentityContext);
        identityContext.setIdentity(undefined);

        const eventHandler = createScheduledActionEventHandler();

        /*
         * Fire the event with tenant in the payload.
         * Without the tenant-aware handler this would fail with "ScheduledAction/NotFound"
         * because the CMS entry lives under the "webiny" tenant.
         */
        const result = await eventHandler.cb({
            payload: {
                [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                    id: createResult.value.id,
                    namespace: PublishTestEntryActionHandlerImpl.name,
                    tenant: "webiny",
                    scheduleFor: new Date(Date.now() + 3 * 60 * 1000).toISOString()
                }
            },
            context: executionContext,
            request: executionContext.request,
            reply: executionContext.reply
        });

        expect(result).toEqual({
            success: true
        });

        /* Tenant context should be restored to root after execution. */
        expect(executionTenantContext.getTenant().id).toBe("root");
    });
});
