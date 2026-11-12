import { afterEach, describe, expect, it, vi } from "vitest";
import { TimerSchedulerService } from "~/TimerSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

/*
 * Many actions due at the same moment: each process has a timer for every one of them, so they all
 * fire together, and no more than the limit may run at a time.
 */
describe("TimerSchedulerService — actions due together", () => {
    const namespace = "Test/SomeEntry";
    const tenant = "root";
    let service: TimerSchedulerService;

    afterEach(async () => {
        vi.useRealTimers();
        await service.stop();
    });

    it("runs 300 actions due at once, no more than the limit at a time", async () => {
        let active = 0;
        let maxActive = 0;
        const ran = new Set<string>();
        const runAction = vi.fn(async (id: string) => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise(resolve => setTimeout(resolve, 5));
            ran.add(id);
            active--;
        });
        service = new TimerSchedulerService({
            logger: createMockLogger(),
            runAction,
            maxConcurrentActions: 10
        });
        await service.start();

        const dueAt = new Date(Date.now() + 500);
        await service.recover(
            Array.from({ length: 300 }, (_, i) => ({
                id: `action-${i}`,
                namespace,
                tenant,
                scheduledFor: dueAt
            }))
        );

        await vi.waitFor(() => expect(ran.size).toBe(300), { timeout: 10_000, interval: 50 });

        expect(runAction).toHaveBeenCalledTimes(300);
        expect(maxActive).toBe(10);
    });

    it("runs an action due later than the longest timer", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
        const runAction = vi.fn().mockResolvedValue(undefined);
        service = new TimerSchedulerService({ logger: createMockLogger(), runAction });
        await service.start();

        const day = 24 * 60 * 60_000;
        await service.create({
            id: "far-1",
            namespace,
            tenant,
            scheduleFor: new Date(Date.now() + 40 * day)
        });

        await vi.advanceTimersByTimeAsync(39 * day);
        expect(runAction).not.toHaveBeenCalled();
        expect(await service.exists({ id: "far-1", namespace, tenant })).toBe(true);

        await vi.advanceTimersByTimeAsync(day);
        expect(runAction).toHaveBeenCalledWith("far-1", namespace, tenant);
    });

    it("logs a failed action and keeps running the rest", async () => {
        const logger = createMockLogger();
        const runAction = vi.fn(async (id: string) => {
            if (id === "fails") {
                throw new Error("boom");
            }
        });
        service = new TimerSchedulerService({ logger, runAction });
        await service.start();

        await service.recover([
            { id: "fails", namespace, tenant, scheduledFor: new Date(Date.now() - 1_000) },
            { id: "runs", namespace, tenant, scheduledFor: new Date(Date.now() - 1_000) }
        ]);

        expect(runAction).toHaveBeenCalledWith("runs", namespace, tenant);
        expect(logger.error).toHaveBeenCalledTimes(1);
    });
});
