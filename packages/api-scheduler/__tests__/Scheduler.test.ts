import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./mocks/scheduleClient.js";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionHandler } from "~/shared/abstractions.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { ListScheduledActionsUseCase } from "~/features/ListScheduledActions/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";

describe("Scheduler", () => {
    const targetId = "target-id#0001";
    const namespace = "TestNamespace";
    const actionType = "TestAction";

    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
    });

    it("should fail to handle due to missing schedule entry", async () => {
        const testContainer = context.container.createChildContainer();

        const executeScheduledAction = testContainer.resolve(ExecuteScheduledActionUseCase);

        const result = await executeScheduledAction.execute("non-existent-id");

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
            title: "Title",
            input: { scheduleOn: new Date(Date.now() + 1000000).toISOString() },
            payload: { some: "payload" }
        });

        expect(scheduleResult.isFail()).toBe(false);

        const actionId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Try to execute - should fail because no handler registered
        const result = await executeScheduledAction.execute(actionId);

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
            title: "Title",
            input: { scheduleOn: new Date(Date.now() + 1000000).toISOString() },
            payload: { some: "payload" }
        });

        expect(scheduleResult.isFail()).toBe(false);

        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Verify schedule entry exists before execution
        const getBeforeResult = await getScheduledAction.execute(scheduleId);
        expect(getBeforeResult.isFail()).toBe(false);
        expect(getBeforeResult.value.id).toBe(scheduleId);
        expect(getBeforeResult.value.namespace).toBe(namespace);
        expect(getBeforeResult.value.actionType).toBe(actionType);

        // Execute the scheduled action
        const executeResult = await executeScheduledAction.execute(scheduleId);

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
                payload: { some: "payload" }
            })
        );

        // Verify schedule entry was deleted after successful execution
        const getAfterResult = await getScheduledAction.execute(scheduleId);
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
            title: "Title",
            input: { scheduleOn: new Date(Date.now() + 1000000).toISOString() },
            payload: { some: "payload" }
        });

        expect(scheduleResult.isFail()).toBe(false);

        const scheduleId = ScheduledActionId.from({ namespace, actionType, targetId });

        // Execute the scheduled action - should fail
        const result = await executeScheduledAction.execute(scheduleId);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect(result.error.message).toContain("Handler execution failed");

        // Verify schedule entry still exists with error stored
        const getErrorResult = await getScheduledAction.execute(scheduleId);
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
            title: "Title",
            input: { scheduleOn: firstDate.toISOString() },
            payload: { version: 1 }
        });

        expect(firstResult.isFail()).toBe(false);

        // Verify first schedule
        const getFirstResult = await getScheduledAction.execute(scheduleId);
        expect(getFirstResult.isFail()).toBe(false);
        expect(new Date(getFirstResult.value.scheduledOn).getTime()).toBe(firstDate.getTime());
        expect(getFirstResult.value.payload).toEqual({ version: 1 });

        // Reschedule (same namespace + actionType + targetId)
        const secondResult = await scheduleAction.execute({
            namespace,
            actionType,
            targetId,
            title: "Title",
            input: { scheduleOn: secondDate.toISOString() },
            payload: { version: 2 }
        });

        expect(secondResult.isFail()).toBe(false);

        // Verify schedule was updated, not duplicated
        const getSecondResult = await getScheduledAction.execute(scheduleId);
        expect(getSecondResult.isFail()).toBe(false);
        expect(getSecondResult.value.id).toBe(scheduleId); // Same ID
        expect(new Date(getSecondResult.value.scheduledOn).getTime()).toBe(secondDate.getTime());
        expect(getSecondResult.value.payload).toEqual({ version: 2 });
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
            title: "Title",
            input: { scheduleOn: new Date(Date.now() + 1000000).toISOString() },
            payload: { some: "payload" }
        });

        const scheduleResult2 = await scheduleAction.execute({
            namespace,
            actionType: "ColonizeMars",
            targetId,
            title: "Title",
            input: { scheduleOn: new Date(Date.now() + 1000000).toISOString() },
            payload: { some: "payload" }
        });

        expect(scheduleResult1.isOk()).toBe(true);
        expect(scheduleResult2.isOk()).toBe(true);

        const scheduledActionsResult = await listScheduledActions.execute({
            where: { namespace, targetId }
        });
        expect(scheduledActionsResult.isOk()).toBe(true);

        const scheduledActions = scheduledActionsResult.value.items;

        expect(scheduledActions.length).toBe(2);

        for (const action of scheduledActions) {
            await cancelAction.execute(action.id);
        }

        // Assert all actions were cancelled
        const allActions = await listScheduledActions.execute({ where: { namespace } });
        expect(allActions.value.items.length).toBe(0);
    });
});
