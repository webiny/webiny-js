import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

const futureDate = (ms: number) => new Date(Date.now() + ms);
const pastDate = (ms: number) => new Date(Date.now() - ms);

describe("BreeSchedulerService — recovery", () => {
    const namespace = "Test/SomeEntry";
    let service: BreeSchedulerService;
    let onTrigger: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        onTrigger = vi.fn().mockResolvedValue(undefined);

        service = new BreeSchedulerService({
            logger: createMockLogger(),
            onTrigger
        });

        await service.start();
    });

    afterEach(async () => {
        await service.stop();
    });

    it("should re-register future actions with bree", async () => {
        await service.recover([
            {
                id: "future-1",
                namespace,
                scheduledFor: futureDate(60_000)
            },
            {
                id: "future-2",
                namespace,
                scheduledFor: futureDate(120_000)
            }
        ]);

        expect(await service.exists("future-1")).toBe(true);
        expect(await service.exists("future-2")).toBe(true);
        expect(onTrigger).not.toHaveBeenCalled();
    });

    it("should fire overdue actions immediately", async () => {
        await service.recover([
            {
                id: "overdue-1",
                namespace,
                scheduledFor: pastDate(60_000)
            }
        ]);

        expect(onTrigger).toHaveBeenCalledWith("overdue-1", namespace);
        expect(await service.exists("overdue-1")).toBe(false);
    });

    it("should handle a mix of overdue and future actions", async () => {
        await service.recover([
            {
                id: "overdue-1",
                namespace,
                scheduledFor: pastDate(60_000)
            },
            {
                id: "future-1",
                namespace,
                scheduledFor: futureDate(60_000)
            }
        ]);

        expect(onTrigger).toHaveBeenCalledTimes(1);
        expect(onTrigger).toHaveBeenCalledWith("overdue-1", namespace);
        expect(await service.exists("future-1")).toBe(true);
    });

    it("should be a noop with an empty list", async () => {
        await service.recover([]);

        expect(onTrigger).not.toHaveBeenCalled();
    });
});
