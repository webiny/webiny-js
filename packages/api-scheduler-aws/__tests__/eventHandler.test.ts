import { beforeEach, describe, expect, it } from "vitest";
import {
    SCHEDULED_ACTION_EVENT_IDENTIFIER,
    SCHEDULED_ACTION_PUBLISH
} from "@webiny/api-scheduler/constants.js";
import { ScheduledActionId } from "@webiny/api-scheduler/domain/ScheduledActionId.js";
import { ScheduledActionLambdaHandler } from "@webiny/api-scheduler";
import { CreateTenantUseCase, TenantScopes } from "@webiny/api-core/exports/api/tenancy.js";
import { TenancyStorageOperations } from "@webiny/api-core/features/tenancy/shared/storageOperations.js";
import { RootTenantValue } from "@webiny/api-core/domain/tenancy/RootTenantValue.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ScheduledActionInputHandler } from "@webiny/api-kernel-core";
import { useHandler } from "./__mocks/handler/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/features/ScheduleAction/index.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";

describe("Scheduler Event Handler", () => {
    const namespace = PublishTestEntryActionHandlerImpl.name;

    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            },
            // In every tenant's scope: an action scheduled on another tenant runs in its scope.
            setup: container => {
                container.register(PublishTestEntryActionHandler);
                container.register(NamespaceHandler);
                container.registerInstance(SchedulerService, new VoidSchedulerService());
                // The scheduled-action event handler is wired by the consuming Lambda app; register
                // it here as the unit under test.
                container.register(ScheduledActionLambdaHandler);
            }
        });
        context = await contextHandler.handler();
        // The handler resolves the event's tenant via GetTenantById (storage-backed). The test
        // request runs as the placeholder root tenant without persisting it, so seed it into storage.
        const now = new Date().toISOString();
        await context.container.resolve(TenancyStorageOperations).createTenant({
            ...RootTenantValue.create(),
            description: "",
            status: "enabled",
            settings: {} as Tenant["settings"],
            tags: [],
            parent: null,
            createdOn: now,
            savedOn: now
        });
    });

    it("should register a handler for scheduled-action events", () => {
        const eventHandler = context.container.resolve(ScheduledActionInputHandler);

        expect(eventHandler).toBeDefined();
        expect(typeof eventHandler.execute).toBe("function");
    });

    it("should run handle action", async () => {
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);

        const scheduleFor = new Date(new Date().getTime() + 5 * 60 * 1000);
        const createResult = await scheduleActionUseCase.execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor,
            immediately: false,
            tenant: "root"
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

        // The handler looks the action up by its ScheduledActionId (namespace#actionType#targetId),
        // not the wby-schedule-* id returned by ScheduleAction.
        const id = ScheduledActionId.from({
            namespace,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001"
        });

        const eventHandler = context.container.resolve(ScheduledActionInputHandler);
        const result = await eventHandler.execute(
            {
                input: {
                    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                        id,
                        namespace,
                        tenant: "root",
                        scheduleFor: new Date(new Date().getTime() + 3 * 60 * 1000).toISOString()
                    }
                },
                metadata: {}
            },
            async () => undefined
        );
        expect(result).toEqual({
            success: true
        });
    });

    it("should execute a scheduled action created on a non-root tenant", async () => {
        const tenantContext = context.container.resolve(TenantContext);
        const getTenantById = context.container.resolve(GetTenantByIdUseCase);

        /* Create the non-root tenant the action will live under. */
        const createTenant = context.container.resolve(CreateTenantUseCase);
        const createTenantResult = await createTenant.execute({
            id: "webiny",
            name: "Webiny",
            description: "",
            tags: [],
            parent: "root"
        });
        expect(createTenantResult.isOk()).toBeTrue();

        const tenantResult = await getTenantById.execute("webiny");
        expect(tenantResult.isOk()).toBeTrue();
        const webinyTenant = tenantResult.value;

        /* Schedule action in the "webiny" tenant's scope. */
        const scheduleFor = new Date(Date.now() + 5 * 60 * 1000);
        const tenantScopes = context.container.resolve(TenantScopes);
        // Called from outside any scope's callback, so the identity is passed in explicitly.
        const scheduler = context.container.resolve(IdentityContext).getIdentity();
        const createResult = await tenantScopes.withTenant(webinyTenant, async scope => {
            const scheduleActionUseCase = scope.resolve(ScheduleActionUseCase);
            return scope.resolve(IdentityContext).withIdentity(scheduler, () =>
                scheduleActionUseCase.execute({
                    namespace: PublishTestEntryActionHandlerImpl.name,
                    actionType: SCHEDULED_ACTION_PUBLISH,
                    targetId: "target-id#0002",
                    scheduleFor,
                    tenant: "root",
                    immediately: false
                })
            );
        });

        expect(createResult.isOk()).toBeTrue();
        expect(createResult.value.tenant).toBe("webiny");

        /* We are back on root — simulating a separate Lambda invocation. */
        expect(tenantContext.getTenant().id).toBe("root");

        const identityContext = context.container.resolve(IdentityContext);
        identityContext.setIdentity(undefined);

        /*
         * Fire the event with tenant in the payload.
         * Without the tenant-aware handler this would fail with "ScheduledAction/NotFound"
         * because the CMS entry lives under the "webiny" tenant.
         */
        const eventHandler = context.container.resolve(ScheduledActionInputHandler);
        const result = await eventHandler.execute(
            {
                input: {
                    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                        id: ScheduledActionId.from({
                            namespace: PublishTestEntryActionHandlerImpl.name,
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            targetId: "target-id#0002"
                        }),
                        namespace: PublishTestEntryActionHandlerImpl.name,
                        tenant: "webiny",
                        scheduleFor: new Date(Date.now() + 3 * 60 * 1000).toISOString()
                    }
                },
                metadata: {}
            },
            async () => undefined
        );

        expect(result).toEqual({
            success: true
        });

        /* The request's own scope is still root's. */
        expect(tenantContext.getTenant().id).toBe("root");
    });
});
