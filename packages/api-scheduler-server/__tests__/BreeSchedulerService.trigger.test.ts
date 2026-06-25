import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreeSchedulerService, type IBreeSchedulerServiceParams } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

describe("BreeSchedulerService — trigger", () => {
    const namespace = "Test/SomeEntry";
    const tenant = "root";
    let service: BreeSchedulerService;
    let onTrigger: IBreeSchedulerServiceParams["onTrigger"];

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

    it("should fire onTrigger when the scheduled time arrives", async () => {
        await service.create({
            id: "trigger-1",
            namespace,
            tenant,
            scheduleFor: new Date(Date.now() + 2_000)
        });

        /* Wait for the bree job to fire. */
        await vi.waitFor(
            () => {
                expect(onTrigger).toHaveBeenCalledWith("trigger-1", namespace);
            },
            { timeout: 5_000, interval: 200 }
        );

        /* Job should be cleaned up after firing. */
        expect(
            await service.exists({
                id: "trigger-1",
                tenant,
                namespace
            })
        ).toBe(false);
    });

    it("should not fire onTrigger if the schedule is deleted before it fires", async () => {
        await service.create({
            id: "deleted-1",
            namespace,
            tenant,
            scheduleFor: new Date(Date.now() + 3_000)
        });

        await service.delete({
            id: "deleted-1",
            tenant,
            namespace
        });

        /* Wait a bit past the scheduled time to confirm it doesn't fire. */
        await new Promise(resolve => setTimeout(resolve, 4_000));

        expect(onTrigger).not.toHaveBeenCalled();
    });
}, 15_000);
