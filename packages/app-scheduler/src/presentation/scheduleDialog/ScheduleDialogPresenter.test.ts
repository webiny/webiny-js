// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { DateFormatter } from "@webiny/app-admin";
import { GetScheduledActionGateway } from "~/features/getScheduledAction/abstractions.js";
import { CancelScheduledActionGateway } from "~/features/cancelScheduledAction/abstractions.js";
import { SchedulePublishActionGateway } from "~/features/schedulePublishAction/abstractions.js";
import { ScheduleUnpublishActionGateway } from "~/features/scheduleUnpublishAction/abstractions.js";
import { ScheduleActionType } from "~/types.js";
import { ScheduleDialogPresenter as Abstraction } from "./abstractions.js";
import { ScheduleDialogPresenter } from "./ScheduleDialogPresenter.js";

/*
 * `useScheduleDialog` shows a success toast and runs `onCompleted` once `schedule()` or
 * `cancel()` resolves, and shows the error when they reject. So a failed action must reject,
 * and the dialog must not be left loading.
 */
const setup = (params: { fail: boolean }) => {
    const execute = vi.fn(async () => {
        if (params.fail) {
            throw new Error("Could not schedule the action.");
        }
        return { item: {} };
    });

    const container = new Container();
    container.registerInstance(GetScheduledActionGateway, { execute: vi.fn() } as any);
    container.registerInstance(CancelScheduledActionGateway, { execute } as any);
    container.registerInstance(SchedulePublishActionGateway, { execute } as any);
    container.registerInstance(ScheduleUnpublishActionGateway, { execute } as any);
    container.registerInstance(DateFormatter, { format: () => "" } as any);
    container.register(ScheduleDialogPresenter);

    return container.resolve(Abstraction);
};

const scheduleParams = (actionType: ScheduleActionType) => ({
    namespace: "cms/article",
    targetId: "entry-1#0001",
    scheduleOn: new Date("2030-01-01T10:00:00.000Z"),
    actionType
});

describe("ScheduleDialogPresenter", () => {
    it.each([ScheduleActionType.publish, ScheduleActionType.unpublish])(
        "rejects when scheduling %s fails",
        async actionType => {
            const presenter = setup({ fail: true });

            await expect(presenter.schedule(scheduleParams(actionType))).rejects.toThrow(
                "Could not schedule the action."
            );
            expect(presenter.vm.loading).toBe(false);
        }
    );

    it("rejects when cancelling fails", async () => {
        const presenter = setup({ fail: true });

        await expect(
            presenter.cancel({ id: "action-1", namespace: "cms/article" })
        ).rejects.toThrow("Could not schedule the action.");
        expect(presenter.vm.loading).toBe(false);
    });

    it("resolves when scheduling and cancelling succeed", async () => {
        const presenter = setup({ fail: false });

        await expect(
            presenter.schedule(scheduleParams(ScheduleActionType.publish))
        ).resolves.toBeUndefined();
        await expect(
            presenter.cancel({ id: "action-1", namespace: "cms/article" })
        ).resolves.toBeUndefined();
        expect(presenter.vm.loading).toBe(false);
    });
});
