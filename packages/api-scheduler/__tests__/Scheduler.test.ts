import { beforeEach, describe, expect, it, vi } from "vitest";
import { until } from "@webiny/project-utils/testing/helpers/until";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionHandler, SchedulerService } from "~/shared/abstractions.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import {
    type IListScheduledActionsResponse,
    ListScheduledActionsUseCase
} from "~/features/ListScheduledActions/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";
import { useHandler } from "./__mocks/handler/useHandler.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { SchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandlerImpl } from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "~/constants.js";

describe("Scheduler", () => {
    const targetId = "target-id#0001";
    const namespace = PublishTestEntryActionHandlerImpl.name;
    const actionType = SCHEDULED_ACTION_PUBLISH;

    let context: CmsContext;

    beforeEach(async () => {
        const mockedSchedulerClient = mockClient(SchedulerClient);
        mockedSchedulerClient.resolves({});
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        // context.container.register(PublishTestEntryActionHandler);
        context.container.register(NamespaceHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should fail to handle due to missing schedule entry", async () => {
        const testContainer = context.container.createChildContainer();

        const executeScheduledAction = testContainer.resolve(ExecuteScheduledActionUseCase);

        const result = await executeScheduledAction.execute({
            id: "non-existent-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });

    it("should fail when no handler is registered", async () => {
        const testContainer = context.container.createChildContainer();

        const scheduleAction = testContainer.resolve(ScheduleActionUseCase);
        const executeScheduledAction = testContainer.resolve(ExecuteScheduledActionUseCase);

        // Schedule an action
        const scheduleResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        expect(scheduleResult.isFail()).toBe(false);

        const actionId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Try to execute - should fail because no handler registered
        const result = await executeScheduledAction.execute({
            id: actionId,
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Handler/NotFound");
        expect(result.error.message).toContain(namespace);
        expect(result.error.message).toContain(actionType);
    });

    it("should invoke handler when action is executed", async () => {
        const testContainer = context.container;

        // Create a mock handler that tracks if it was called
        const mockHandler = {
            canHandle: vi.fn((ns: string, type: string) => ns === namespace && type === actionType),
            handle: vi.fn(async () => {
                // Handler was invoked successfully
            })
        };

        testContainer.registerInstance(ScheduledActionHandler, mockHandler);

        const scheduleAction = testContainer.resolve(ScheduleActionUseCase);
        const executeScheduledAction = testContainer.resolve(ExecuteScheduledActionUseCase);
        const getScheduledAction = testContainer.resolve(GetScheduledActionUseCase);

        // Schedule an action
        const scheduleResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        expect(scheduleResult.isFail()).toBe(false);

        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Verify schedule entry exists before execution
        const getBeforeResult = await getScheduledAction.execute({
            id: scheduleId,
            namespace
        });
        expect(getBeforeResult.isFail()).toBe(false);
        expect(getBeforeResult.value.id).toBe(scheduleId);
        expect(getBeforeResult.value.namespace).toBe(namespace);
        expect(getBeforeResult.value.actionType).toBe(actionType);

        // Execute the scheduled action
        const executeResult = await executeScheduledAction.execute({
            id: scheduleId,
            namespace
        });

        expect(executeResult.isFail()).toBe(false);

        // Verify handler was called with correct action
        expect(mockHandler.canHandle).toHaveBeenCalled();
        expect(mockHandler.handle).toHaveBeenCalledTimes(1);
        expect(mockHandler.handle).toHaveBeenCalledWith(
            expect.objectContaining({
                id: scheduleId,
                namespace,
                actionType,
                targetId,
                payload: {
                    actionType: SCHEDULED_ACTION_PUBLISH,
                    namespace: PublishTestEntryActionHandlerImpl.name,
                    scheduleId: expect.any(String),
                    something: true,
                    targetId: "target-id#0001",
                    title: "Fetched title from handler"
                },
                scheduledBy: {
                    id: "id-12345678",
                    type: "admin",
                    displayName: "John Doe"
                },
                scheduledFor: expect.any(Date),
                title: "Fetched title from handler"
            })
        );

        // Verify schedule entry was deleted after successful execution
        const getAfterResult = await getScheduledAction.execute({
            id: scheduleId,
            namespace
        });
        expect(getAfterResult.isFail()).toBe(true);
        expect(getAfterResult.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });

    it("should store error when handler throws", async () => {
        const testContainer = context.container;

        // Register a handler that always throws
        testContainer.registerInstance(ScheduledActionHandler, {
            canHandle: () => true,
            async handle(): Promise<void> {
                throw new Error("Handler execution failed");
            }
        });

        const scheduleAction = testContainer.resolve(ScheduleActionUseCase);
        const executeScheduledAction = testContainer.resolve(ExecuteScheduledActionUseCase);
        const getScheduledAction = testContainer.resolve(GetScheduledActionUseCase);

        // Schedule an action
        const scheduleResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        expect(scheduleResult.isFail()).toBe(false);

        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Execute the scheduled action - should fail
        const result = await executeScheduledAction.execute({
            id: scheduleId,
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect(result.error.message).toContain("Handler execution failed");

        // Verify schedule entry still exists with error stored
        const getErrorResult = await getScheduledAction.execute({
            id: scheduleId,
            namespace
        });
        expect(getErrorResult.isFail()).toBe(false);
        expect(getErrorResult.value.error).toContain("Handler execution failed");
    });

    it("should update existing schedule when rescheduling", async () => {
        const testContainer = context.container;

        const mockHandler = {
            canHandle: vi.fn(() => true),
            handle: vi.fn(async () => {})
        };

        testContainer.registerInstance(ScheduledActionHandler, mockHandler);

        const scheduleAction = testContainer.resolve(ScheduleActionUseCase);
        const getScheduledAction = testContainer.resolve(GetScheduledActionUseCase);

        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });
        const firstDate = new Date(Date.now() + 1000000);
        const secondDate = new Date(Date.now() + 2000000);

        // Schedule first time
        const firstResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: firstDate
        });

        expect(firstResult.isFail()).toBe(false);

        // Verify first schedule
        const getFirstResult = await getScheduledAction.execute({
            id: scheduleId,
            namespace
        });
        expect(getFirstResult.isFail()).toBe(false);
        expect(new Date(getFirstResult.value.scheduledFor).getTime()).toBe(firstDate.getTime());
        expect(getFirstResult.value.payload).toEqual({
            actionType: SCHEDULED_ACTION_PUBLISH,
            namespace: PublishTestEntryActionHandlerImpl.name,
            scheduleId: expect.any(String),
            something: true,
            targetId: "target-id#0001",
            title: "Fetched title from handler"
        });

        // Reschedule (same namespace + actionType + targetId)
        const secondResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: secondDate
        });

        expect(secondResult.isFail()).toBe(false);

        // Verify schedule was updated, not duplicated
        const getSecondResult = await getScheduledAction.execute({
            id: scheduleId,
            namespace
        });
        expect(getSecondResult.isFail()).toBe(false);
        expect(getSecondResult.value.id).toBe(scheduleId); // Same ID
        expect(new Date(getSecondResult.value.scheduledFor).getTime()).toBe(secondDate.getTime());
        expect(getSecondResult.value.payload).toEqual({
            actionType: SCHEDULED_ACTION_PUBLISH,
            namespace: PublishTestEntryActionHandlerImpl.name,
            scheduleId: expect.any(String),
            something: true,
            targetId: "target-id#0001",
            title: "Fetched title from handler"
        });
    });

    it("should list and cancel all scheduled actions", async () => {
        const testContainer = context.container;

        const scheduleAction = testContainer.resolve(ScheduleActionUseCase);
        const cancelAction = testContainer.resolve(CancelScheduledActionUseCase);
        const listScheduledActions = testContainer.resolve(ListScheduledActionsUseCase);

        // Schedule an action
        const scheduleResult1 = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        const scheduleResult2 = await scheduleAction.execute({
            namespace,
            actionType: SCHEDULED_ACTION_UNPUBLISH,
            targetId,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        expect(scheduleResult1.isOk()).toBe(true);
        expect(scheduleResult2.isOk()).toBe(true);

        const scheduledActionsResult: IListScheduledActionsResponse<GenericRecord> = await until(
            async () => {
                const result = await listScheduledActions.execute({
                    where: {
                        namespace,
                        targetId
                    }
                });
                return result.isOk() ? result.value : { items: [], meta: {} };
            },
            (result: any) => {
                return result.items.length === 2;
            }
        );

        const scheduledActions = scheduledActionsResult.items;

        expect(scheduledActions.length).toBe(2);

        for (const action of scheduledActions) {
            await cancelAction.execute(action);
        }

        // Assert all actions were canceled
        const allActions = await until(
            async () => {
                const result = await listScheduledActions.execute({ where: { namespace } });
                return result.isOk() ? result.value : { items: [], meta: {} };
            },
            (result: any) => result.items.length === 0
        );
        expect(allActions.items.length).toBe(0);

        // Ensure the records were deleted from the database
        const client = getDocumentClient();
        const scanned = await client.scan({ TableName: process.env.DB_TABLE });

        const dbRecords = (scanned.Items ?? []).filter(item =>
            item.GSI1_PK.startsWith("wby-schedule-")
        );

        expect(dbRecords.length).toBe(0);
    });
});
