import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { SchedulerSingleton } from "~/scheduler/abstractions/SchedulerSingleton.js";
import { startSchedulerServer } from "~/scheduler/schedulerServer.js";

const createServer = () => {
    const scheduler = {
        start: vi.fn(async () => {}),
        stop: vi.fn(async () => {}),
        waitForRunning: vi.fn(async () => {})
    };
    const dispatch = vi.fn(async () => ({ recovered: 0, failedTenants: [] }));
    const container = new Container();
    container.registerInstance(SchedulerSingleton, scheduler as any);
    container.registerInstance(EventDispatcher, { dispatch } as any);
    return { container, scheduler, dispatch };
};

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("startSchedulerServer", () => {
    // Every minute, so actions scheduled or moved in another process reach this one's timers.
    it("recovers at boot and then every minute", async () => {
        vi.useFakeTimers();
        vi.spyOn(console, "log").mockImplementation(() => {});
        const { container, scheduler, dispatch } = createServer();

        await startSchedulerServer(container);
        await vi.advanceTimersByTimeAsync(0);
        expect(scheduler.start).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(60_000);
        expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it("does not start a run while the previous one is still going", async () => {
        vi.useFakeTimers();
        vi.spyOn(console, "log").mockImplementation(() => {});
        const { container, dispatch } = createServer();
        dispatch.mockImplementationOnce(() => new Promise(() => {}));

        await startSchedulerServer(container);
        await vi.advanceTimersByTimeAsync(120_000);

        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it("stops the timers and recovery, then waits for running actions", async () => {
        vi.useFakeTimers();
        vi.spyOn(console, "log").mockImplementation(() => {});
        const { container, scheduler, dispatch } = createServer();
        const stop = await startSchedulerServer(container);
        await vi.advanceTimersByTimeAsync(0);

        await stop(6000);
        await vi.advanceTimersByTimeAsync(120_000);

        expect(scheduler.stop).toHaveBeenCalled();
        expect(scheduler.waitForRunning).toHaveBeenCalledWith(6000);
        expect(dispatch).toHaveBeenCalledTimes(1);
    });
});
