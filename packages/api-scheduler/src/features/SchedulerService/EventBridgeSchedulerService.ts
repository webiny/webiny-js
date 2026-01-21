import { WebinyError } from "@webiny/error";
import { SchedulerService } from "~/shared/abstractions.js";
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    type SchedulerClient,
    UpdateScheduleCommand
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
export class EventBridgeSchedulerService implements SchedulerService.Interface {
    constructor(
        private getClient: (config?: any) => Pick<SchedulerClient, "send">,
        private config: ISchedulerConfig
    ) {}

    async create(params: { id: string; scheduleFor: Date; payload?: any }): Promise<void> {
        const { id, scheduleFor, payload } = params;

        // Validate date is in future
        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                {
                    scheduleFor,
                    id
                }
            );
        }

        const client = this.getClient();

        // Check if schedule already exists (for auto-update logic)
        const exists = await this.exists(id);
        if (exists) {
            return this.update(params);
        }

        // Format: at(YYYY-MM-DDTHH:mm:ss) - EventBridge expects this format
        const scheduleExpression = `at(${scheduleFor.toISOString().replace(/\.\d{3}Z$/, "")})`;

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

    async update(params: { id: string; scheduleFor: Date; payload?: any }): Promise<void> {
        const { id, scheduleFor, payload } = params;

        // Validate date is in future
        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                { scheduleFor, id }
            );
        }

        const client = this.getClient();

        const scheduleExpression = `at(${scheduleFor.toISOString().replace(/\.\d{3}Z$/, "")})`;

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

        const exists = await this.exists(id);
        if (!exists) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        try {
            await client.send(new DeleteScheduleCommand({ Name: id }));
        } catch (ex) {
            throw WebinyError.from(ex);
        }
    }

    async exists(id: string): Promise<boolean> {
        const client = this.getClient();

        try {
            await client.send(new GetScheduleCommand({ Name: id }));
            return true;
        } catch (ex) {
            console.log(ex);
            if (ex.name === "ResourceNotFoundException") {
                return false;
            }
            throw ex;
        }
    }
}
