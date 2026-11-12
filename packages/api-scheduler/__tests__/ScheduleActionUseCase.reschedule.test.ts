import { describe, expect, it, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/ScheduleActionUseCase.js";
import { SCHEDULED_ACTION_PUBLISH } from "~/constants.js";

/**
 * Pure unit test (no DynamoDB): rescheduling an existing action with `immediately: true`
 * must use the computed date, not the (possibly missing) `params.scheduleFor`.
 */
const setup = () => {
    const existing = {
        id: "existing-schedule",
        tenant: "root",
        title: "Title",
        namespace: "Cms/Entry/Article",
        actionType: SCHEDULED_ACTION_PUBLISH,
        targetId: "target-id#0001",
        scheduledBy: { id: "id", type: "admin", displayName: "Admin" },
        scheduledFor: new Date("2030-01-01T00:00:00.000Z"),
        payload: { foo: "bar" }
    };
    const updateEntry = { execute: vi.fn(async () => Result.ok({})) };
    const schedulerService = { create: vi.fn(), update: vi.fn(async () => undefined) };

    const scheduleAction = new ScheduleActionUseCase(
        { getIdentity: () => ({ id: "id", type: "admin", displayName: "Admin" }) } as any,
        {} as any,
        schedulerService as any,
        { execute: async () => Result.ok(existing) } as any,
        { execute: vi.fn() } as any,
        updateEntry as any,
        { execute: vi.fn() } as any,
        { execute: async () => Result.ok({ title: "Title" }) } as any
    );

    return {
        scheduleAction,
        updateEntry,
        schedulerService
    };
};

describe("ScheduleActionUseCase reschedule", () => {
    it("should reschedule an existing action immediately using the computed date", async () => {
        const { scheduleAction, updateEntry, schedulerService } = setup();
        const before = Date.now();

        const result = await scheduleAction.execute({
            tenant: "root",
            namespace: "Cms/Entry/Article",
            targetId: "target-id#0001",
            actionType: SCHEDULED_ACTION_PUBLISH,
            scheduleFor: undefined as unknown as Date,
            immediately: true
        });

        expect(result.isOk()).toBe(true);
        const scheduledFor = result.value.scheduledFor;
        expect(scheduledFor).toBeInstanceOf(Date);
        expect(scheduledFor.getTime()).toBeGreaterThanOrEqual(before);

        expect(updateEntry.execute).toHaveBeenCalledTimes(1);
        expect(schedulerService.update).toHaveBeenCalledWith(
            expect.objectContaining({ scheduleFor: scheduledFor })
        );
    });
});
