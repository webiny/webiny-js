import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebinyError } from "@webiny/error";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";
import type { ISchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";

type CreateInput = Parameters<ISchedulerService["create"]>[0];

const futureDate = (ms: number) => new Date(Date.now() + ms);
const pastDate = (ms: number) => new Date(Date.now() - ms);

describe("BreeSchedulerService", () => {
    const namespace = "Test/SomeEntry";
    const tenant = "root";
    let service: BreeSchedulerService;
    let onTrigger: ReturnType<typeof vi.fn>;
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(async () => {
        onTrigger = vi.fn().mockResolvedValue(undefined);
        logger = createMockLogger();

        service = new BreeSchedulerService({
            logger,
            onTrigger
        });

        await service.start();
    });

    afterEach(async () => {
        await service.stop();
    });

    describe("create", () => {
        it("should register a job and track the namespace", async () => {
            const input: CreateInput = {
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            };

            await service.create(input);

            const exists = await service.exists({ id: "schedule-1", namespace, tenant });
            expect(exists).toBe(true);
        });

        it("should throw when scheduling in the past", async () => {
            const input: CreateInput = {
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: pastDate(10_000)
            };

            await expect(service.create(input)).rejects.toThrow(WebinyError);
        });

        it("should delegate to update when the id already exists", async () => {
            const input: CreateInput = {
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            };

            await service.create(input);

            const updatedInput: CreateInput = {
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(120_000)
            };

            await service.create(updatedInput);

            const exists = await service.exists({ id: "schedule-1", namespace, tenant });
            expect(exists).toBe(true);
        });
    });

    describe("update", () => {
        it("should remove the old job and create a new one", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            await service.update({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(120_000)
            });

            const exists = await service.exists({ id: "schedule-1", namespace, tenant });
            expect(exists).toBe(true);
        });

        it("should throw when updating with a past date", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            await expect(
                service.update({
                    id: "schedule-1",
                    namespace,
                    tenant,
                    scheduleFor: pastDate(10_000)
                })
            ).rejects.toThrow(WebinyError);
        });
    });

    describe("delete", () => {
        it("should remove an existing job", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            await service.delete({ id: "schedule-1", namespace, tenant });

            const exists = await service.exists({ id: "schedule-1", namespace, tenant });
            expect(exists).toBe(false);
        });

        it("should throw when deleting a non-existent job", async () => {
            await expect(service.delete({ id: "non-existent", namespace, tenant })).rejects.toThrow(
                WebinyError
            );
        });
    });

    describe("exists", () => {
        it("should return true for a registered job", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            expect(await service.exists({ id: "schedule-1", namespace, tenant })).toBe(true);
        });

        it("should return false for an unknown job", async () => {
            expect(await service.exists({ id: "unknown", namespace, tenant })).toBe(false);
        });
    });

    describe("safeRemove logging", () => {
        // safeRemove() ignores errors from bree.stop()/remove() and just logs them at debug level.
        // It's there for the case where a job fires on its own (so bree forgets it) right before we
        // try to delete it. To reach that branch, our `jobs` map has to still contain an id that bree
        // no longer knows about — but in normal use create, delete, and firing all keep the two in
        // sync, so there's no way to set that up through the public API. That's why this test reaches
        // into the private `jobs` map directly: it's the only way to recreate the mismatch without
        // making bree injectable, which felt like too much for a bit of defensive logging.
        it("should log debug when stop/remove fail silently", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            // First delete removes the job from both the `jobs` map and bree.
            await service.delete({ id: "schedule-1", namespace, tenant });

            // Now add it back to the `jobs` map only, so bree no longer has it. exists() reads the
            // `jobs` map, so the next delete gets past its "does not exist" check and calls
            // safeRemove(), where bree throws for the unknown job and we log it at debug.
            (service as any).jobs.set("schedule-1", { namespace, tenant });
            await service.delete({ id: "schedule-1", namespace, tenant });

            expect(logger.debug).toHaveBeenCalled();
        });
    });
});
