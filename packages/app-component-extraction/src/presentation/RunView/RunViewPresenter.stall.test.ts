// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { RunViewPresenterImpl } from "./RunViewPresenter.js";
import type { RunDto } from "~/shared/types.js";

/*
 * Resuming a stage is offered only when the ledger says running and the stage's task has stopped,
 * read twice in a row (the moment between a task's last write and the ledger turning "done" must not
 * show it).
 */
const run = (status: string): RunDto =>
    ({
        id: "r",
        stages: [{ stage: "generate", status, taskId: "t1" }]
    }) as unknown as RunDto;

const presenterWith = (statuses: (string | null)[]) => {
    const getTaskStatus = vi.fn(async () => statuses.shift() ?? null);
    const presenter = new RunViewPresenterImpl({ getTaskStatus } as never);
    const check = async (r: RunDto) => {
        // Each check is a new 30 s window.
        (presenter as unknown as { stallCheckedAt: number }).stallCheckedAt = 0;
        await (presenter as unknown as { checkStall(r: RunDto): Promise<void> }).checkStall(r);
    };
    return { presenter, check, getTaskStatus };
};

describe("stalled stage", () => {
    it("is flagged on the second stopped reading, not the first", async () => {
        const { presenter, check } = presenterWith(["failed", "failed"]);
        await check(run("running"));
        expect(presenter.vm.stalledStage).toBeNull();
        await check(run("running"));
        expect(presenter.vm.stalledStage).toEqual({ stage: "generate", taskStatus: "failed" });
    });

    it("is never flagged while the task runs or waits", async () => {
        const { presenter, check } = presenterWith(["running", "pending", "running"]);
        for (let i = 0; i < 3; i++) {
            await check(run("running"));
        }
        expect(presenter.vm.stalledStage).toBeNull();
    });

    it("clears once the stage is no longer running", async () => {
        const { presenter, check } = presenterWith(["aborted", "aborted"]);
        await check(run("running"));
        await check(run("running"));
        expect(presenter.vm.stalledStage).not.toBeNull();
        await check(run("done"));
        expect(presenter.vm.stalledStage).toBeNull();
    });

    it("does not flag when the status cannot be read", async () => {
        const { presenter, check } = presenterWith([null, null]);
        await check(run("running"));
        await check(run("running"));
        expect(presenter.vm.stalledStage).toBeNull();
    });
});
