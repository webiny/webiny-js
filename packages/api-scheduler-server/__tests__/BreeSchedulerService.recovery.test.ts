import { afterEach, describe, expect, it, vi } from "vitest";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

const futureDate = (ms: number) => new Date(Date.now() + ms);
const pastDate = (ms: number) => new Date(Date.now() - ms);

describe("BreeSchedulerService — recovery", () => {
    const namespace = "Test/SomeEntry";
    let service: BreeSchedulerService;
    let onTrigger: ReturnType<typeof vi.fn>;

    afterEach(async () => {
        await service.stop();
    });

    const createService = () => {
        onTrigger = vi.fn().mockResolvedValue(undefined);

        service = new BreeSchedulerService({
            logger: createMockLogger(),
            onTrigger
        });

        return service;
    };

    it("should re-register future actions with bree", async () => {
        const svc = createService();

        await svc.start([
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

        expect(await svc.exists("future-1")).toBe(true);
        expect(await svc.exists("future-2")).toBe(true);
        expect(onTrigger).not.toHaveBeenCalled();
    });

    it("should fire overdue actions immediately", async () => {
        const svc = createService();

        await svc.start([
            {
                id: "overdue-1",
                namespace,
                scheduledFor: pastDate(60_000)
            }
        ]);

        expect(onTrigger).toHaveBeenCalledWith("overdue-1", namespace);
        expect(await svc.exists("overdue-1")).toBe(false);
    });

    it("should handle a mix of overdue and future actions", async () => {
        const svc = createService();

        await svc.start([
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
        expect(await svc.exists("future-1")).toBe(true);
    });

    it("should be a noop with an empty list", async () => {
        const svc = createService();

        await svc.start([]);

        expect(onTrigger).not.toHaveBeenCalled();
    });
});
