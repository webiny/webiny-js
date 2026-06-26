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
        it("should log debug when stop/remove fail silently", async () => {
            await service.create({
                id: "schedule-1",
                namespace,
                tenant,
                scheduleFor: futureDate(60_000)
            });

            /* Delete once to remove the bree job. */
            await service.delete({ id: "schedule-1", namespace, tenant });

            /* Manually re-add namespace so delete doesn't throw "does not exist". */
            (service as any).namespaces.set("schedule-1", namespace);
            await service.delete({ id: "schedule-1", namespace, tenant });

            expect(logger.debug).toHaveBeenCalled();
        });
    });
});
