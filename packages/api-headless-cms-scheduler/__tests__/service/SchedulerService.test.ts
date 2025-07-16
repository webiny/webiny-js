import { SchedulerService } from "~/service/SchedulerService.js";
import type {
    ISchedulerServiceCreateInput,
    ISchedulerServiceUpdateInput
} from "~/service/types.js";
import { WebinyError } from "@webiny/error";

describe("SchedulerService", () => {
    const lambdaArn = "arn:aws:lambda:us-east-1:123456789012:function:test";
    const roleArn = "arn:aws:iam::123456789012:role/test-role";
    const config = {
        lambdaArn,
        roleArn
    };

    function createMockClient(sendImpl?: (command: any) => any) {
        return {
            send: jest.fn(sendImpl)
        };
    }

    it("creates a schedule successfully", async () => {
        const mockClient = createMockClient(async () => ({}));
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });

        const input: ISchedulerServiceCreateInput = {
            id: "schedule-1",
            dateOn: new Date(Date.now() + 100000)
        };

        await expect(service.create(input)).resolves.toBeUndefined();
        expect(mockClient.send).toHaveBeenCalled();
    });

    it("throws if creating a schedule in the past", async () => {
        const mockClient = createMockClient();
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });

        const input: ISchedulerServiceCreateInput = {
            id: "schedule-1",
            dateOn: new Date(Date.now() - 100000)
        };

        await expect(service.create(input)).rejects.toThrow(WebinyError);
    });

    it("updates a schedule successfully", async () => {
        const mockClient = createMockClient(async () => ({}));
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });

        const input: ISchedulerServiceUpdateInput = {
            id: "schedule-1",
            dateOn: new Date(Date.now() + 100000)
        };

        await expect(service.update(input)).resolves.toBeUndefined();
        expect(mockClient.send).toHaveBeenCalled();
    });

    it("throws if updating a schedule in the past", async () => {
        const mockClient = createMockClient();
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });

        const input: ISchedulerServiceUpdateInput = {
            id: "schedule-1",
            dateOn: new Date(Date.now() - 100000)
        };

        await expect(service.update(input)).rejects.toThrow(WebinyError);
    });

    it("deletes a schedule successfully if it exists", async () => {
        const mockClient = createMockClient(async () => ({}));
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });
        jest.spyOn(service, "exists").mockResolvedValue(true);
        await expect(service.delete("schedule-1")).resolves.toBeUndefined();
        expect(mockClient.send).toHaveBeenCalled();
    });

    it("does not delete a schedule if it does not exist", async () => {
        const mockClient = createMockClient();
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });
        jest.spyOn(service, "exists").mockResolvedValue(false);
        await expect(service.delete("schedule-1")).resolves.toBeUndefined();
        expect(mockClient.send).not.toHaveBeenCalled();
    });

    it("exists returns true if schedule is found", async () => {
        const mockClient = createMockClient(async () => ({ $metadata: { httpStatusCode: 200 } }));
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });
        await expect(service.exists("schedule-1")).resolves.toBe(true);
        expect(mockClient.send).toHaveBeenCalled();
    });

    it("exists returns false if ResourceNotFoundException is thrown", async () => {
        const mockClient = createMockClient(async () => {
            const err: any = new Error("not found");
            err.name = "ResourceNotFoundException";
            throw err;
        });
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });
        await expect(service.exists("schedule-1")).resolves.toBe(false);
        expect(mockClient.send).toHaveBeenCalled();
    });

    it("throws on unknown error in exists", async () => {
        const mockClient = createMockClient(async () => {
            throw new Error("unknown");
        });
        const service = new SchedulerService({
            getClient: () => mockClient,
            config
        });
        await expect(service.exists("schedule-1")).rejects.toThrow("unknown");
        expect(mockClient.send).toHaveBeenCalled();
    });
});
