import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreeSchedulerService, type IBreeSchedulerServiceParams } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

describe("BreeSchedulerService — trigger", () => {
    const namespace = "Test/SomeEntry";
    const tenant = "root";
    let service: BreeSchedulerService;
    let runAction: IBreeSchedulerServiceParams["runAction"];

    beforeEach(async () => {
        runAction = vi.fn().mockResolvedValue(undefined);

        service = new BreeSchedulerService({
            logger: createMockLogger(),
            runAction
        });

        await service.start();
    });

    afterEach(async () => {
        await service.stop();
    });

    it("should run the action when the scheduled time arrives", async () => {
        await service.create({
            id: "trigger-1",
            namespace,
            tenant,
            scheduleFor: new Date(Date.now() + 2_000)
        });

        /* Wait for the bree job to fire. */
        await vi.waitFor(
            () => {
                expect(runAction).toHaveBeenCalledWith("trigger-1", namespace, tenant);
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

    it("should not run the action if the schedule is deleted before it fires", async () => {
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

        expect(runAction).not.toHaveBeenCalled();
    });
}, 15_000);
