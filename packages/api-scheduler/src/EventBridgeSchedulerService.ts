import { WebinyError } from "@webiny/error";
import { SchedulerService } from "./abstractions.js";
import {
    CreateScheduleCommand,
    UpdateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    type SchedulerClient
} from "@webiny/aws-sdk/client-scheduler";

export interface ISchedulerConfig {
    lambdaArn: string;
    roleArn: string;
}

/**
 * AWS EventBridge Scheduler implementation
 *
 * This is the AWS-specific implementation of the cloud-agnostic SchedulerService abstraction.
 *
 * Manages schedules in AWS EventBridge Scheduler for triggering Lambda functions
 * at specified future times.
 */
class EventBridgeSchedulerServiceImpl implements SchedulerService.Interface {
    constructor(
        private getClient: (config?: any) => SchedulerClient,
        private config: ISchedulerConfig
    ) {}

    async create(params: { id: string; scheduleOn: Date; payload: any }): Promise<void> {
        const { id, scheduleOn, payload } = params;

        // Validate date is in future
        if (scheduleOn <= new Date()) {
            throw new WebinyError(
                "Cannot schedule in the past",
                "INVALID_SCHEDULE_DATE",
                { scheduleOn, id }
            );
        }

        const client = this.getClient();

        // Check if schedule already exists (for auto-update logic)
        const exists = await this.exists(id);
        if (exists) {
            return this.update(params);
        }

        // Format: at(YYYY-MM-DDTHH:mm:ss) - EventBridge expects this format
        const scheduleExpression = `at(${scheduleOn.toISOString().replace(/\.\d{3}Z$/, "")})`;

        await client.send(
            new CreateScheduleCommand({
                Name: id,
                ScheduleExpression: scheduleExpression,
                FlexibleTimeWindow: { Mode: "OFF" }, // Exact time execution
                Target: {
                    Arn: this.config.lambdaArn,
                    RoleArn: this.config.roleArn,
                    Input: JSON.stringify(payload)
                },
                ActionAfterCompletion: "DELETE" // Auto-cleanup after execution
            })
        );
    }

    async update(params: { id: string; scheduleOn: Date; payload: any }): Promise<void> {
        const { id, scheduleOn, payload } = params;

        // Validate date is in future
        if (scheduleOn <= new Date()) {
            throw new WebinyError(
                "Cannot schedule in the past",
                "INVALID_SCHEDULE_DATE",
                { scheduleOn, id }
            );
        }

        const client = this.getClient();

        const scheduleExpression = `at(${scheduleOn.toISOString().replace(/\.\d{3}Z$/, "")})`;

        await client.send(
            new UpdateScheduleCommand({
                Name: id,
                ScheduleExpression: scheduleExpression,
                FlexibleTimeWindow: { Mode: "OFF" },
                Target: {
                    Arn: this.config.lambdaArn,
                    RoleArn: this.config.roleArn,
                    Input: JSON.stringify(payload)
                },
                ActionAfterCompletion: "DELETE"
            })
        );
    }

    async delete(id: string): Promise<void> {
        const client = this.getClient();

        try {
            await client.send(new DeleteScheduleCommand({ Name: id }));
        } catch (ex) {
            // Ignore if schedule doesn't exist
            if (ex.name === "ResourceNotFoundException") {
                return;
            }
            throw ex;
        }
    }

    async exists(id: string): Promise<boolean> {
        const client = this.getClient();

        try {
            await client.send(new GetScheduleCommand({ Name: id }));
            return true;
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return false;
            }
            throw ex;
        }
    }
}

export const EventBridgeSchedulerService = SchedulerService.createImplementation({
    implementation: EventBridgeSchedulerServiceImpl,
    // Dependencies will be registered as instances in context
    dependencies: []
});
