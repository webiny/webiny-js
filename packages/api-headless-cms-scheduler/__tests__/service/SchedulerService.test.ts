import { SchedulerService } from "~/service/SchedulerService.js";
import type {
    ISchedulerServiceCreateInput,
    ISchedulerServiceUpdateInput
} from "~/service/types.js";
import { WebinyError } from "@webiny/error";
import { mockClient } from "aws-sdk-client-mock";
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    SchedulerClient,
    UpdateScheduleCommand
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { describe, expect, it, vi } from "vitest";

describe("SchedulerService", () => {
    const lambdaArn = "arn:aws:lambda:us-east-1:123456789012:function:test";
    const roleArn = "arn:aws:iam::123456789012:role/test-role";
    const config = {
        lambdaArn,
        roleArn
    };

    it("creates a schedule successfully", async () => {
        const client = mockClient(SchedulerClient);
        client.on(CreateScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 999
            }
        });

        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const input: ISchedulerServiceCreateInput = {
            id: "schedule-1",
            scheduleOn: new Date(Date.now() + 1000000)
        };

        const result = await service.create(input);
        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 999
            }
        });
    });

    it("throws if creating a schedule in the past", async () => {
        const client = mockClient(SchedulerClient);
        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const input: ISchedulerServiceCreateInput = {
            id: "schedule-1",
            scheduleOn: new Date(Date.now() - 100000)
        };

        try {
            const result = await service.create(input);
            expect(result).toEqual("SHOULD NOT REACH HERE");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WebinyError);
            expect(ex.message).toContain(
                `Cannot create a schedule for "schedule-1" with date in the past:`
            );
        }
    });

    it("updates a schedule successfully", async () => {
        const client = mockClient(SchedulerClient);
        client.on(UpdateScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 999
            }
        });
        client.on(GetScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const input: ISchedulerServiceUpdateInput = {
            id: "schedule-1",
            scheduleOn: new Date(Date.now() + 1000000)
        };

        const result = await service.update(input);

        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 999
            }
        });
    });

    it("throws if updating a schedule in the past", async () => {
        const client = mockClient(SchedulerClient);
        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const input: ISchedulerServiceUpdateInput = {
            id: "schedule-1",
            scheduleOn: new Date(Date.now())
        };

        try {
            const result = await service.update(input);
            expect(result).toEqual("SHOULD NOT REACH HERE");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WebinyError);
            expect(ex.message).toContain(
                `Cannot update an existing schedule for "schedule-1" with date in the past:`
            );
        }
    });

    it("deletes a schedule successfully if it exists", async () => {
        const client = mockClient(SchedulerClient);

        client.on(DeleteScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 999
            }
        });

        const service = new SchedulerService({
            getClient: () => client,
            config
        });
        vi.spyOn(service, "exists").mockResolvedValue(true);

        const result = await service.delete("schedule-1");

        expect(result).toEqual({
            $metadata: {
                httpStatusCode: 999
            }
        });
    });

    it("does not delete a schedule if it does not exist", async () => {
        const client = mockClient(SchedulerClient);
        const service = new SchedulerService({
            getClient: () => client,
            config
        });
        vi.spyOn(service, "exists").mockResolvedValue(false);

        try {
            const result = await service.delete("schedule-1");
            expect(result).toEqual("SHOULD NOT REACH HERE");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WebinyError);
            expect(ex.message).toContain(
                `Cannot delete schedule "schedule-1" because it does not exist.`
            );
        }
    });

    it("exists returns true if schedule is found", async () => {
        const client = mockClient(SchedulerClient);
        client.on(GetScheduleCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const result = await service.exists("schedule-1");

        expect(result).toEqual(true);
    });

    it("exists returns false if ResourceNotFoundException is thrown", async () => {
        const client = mockClient(SchedulerClient);
        client.on(GetScheduleCommand).callsFake(async () => {
            const error = new Error("Resource not found.");
            error.name = "ResourceNotFoundException";
            throw error;
        });
        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const result = await service.exists("schedule-1");
        expect(result).toBe(false);
    });

    it("throws on unknown error in exists", async () => {
        const client = mockClient(SchedulerClient);
        client.on(GetScheduleCommand).callsFake(async () => {
            throw new Error("Unknown error.");
        });
        const service = new SchedulerService({
            getClient: () => client,
            config
        });

        const result = await service.exists("schedule-1");

        expect(result).toEqual(false);
    });
});
