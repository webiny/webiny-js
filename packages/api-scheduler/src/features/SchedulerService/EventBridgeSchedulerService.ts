import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "~/shared/abstractions.js";
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    type SchedulerClient,
    UpdateScheduleCommand
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { IScheduledActionEventPayload } from "~/createEventHandler.js";

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
    public constructor(
        private getClient: (config?: any) => Pick<SchedulerClient, "send">,
        private config: ISchedulerConfig
    ) {}

    public async create(params: SchedulerService.CreateParams): Promise<void> {
        const { id, scheduleFor, tenant } = params;

        // Validate date is in future
        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                {
                    scheduleFor,
                    tenant,
                    id
                }
            );
        }

        const client = this.getClient();

        // Check if schedule already exists (for auto-update logic)
        const exists = await this.exists(params);
        if (exists) {
            return this.update(params);
        }

        await client.send(
            new CreateScheduleCommand({
                Name: id,
                ScheduleExpression: this.createScheduleExpression(scheduleFor),
                FlexibleTimeWindow: {
                    Mode: "OFF"
                },
                Target: {
                    Arn: this.config.lambdaArn,
                    RoleArn: this.config.roleArn,
                    Input: this.createScheduledActionEventInput(params)
                },
                ActionAfterCompletion: "DELETE" // Auto-cleanup after execution
            })
        );
    }

    public async update(params: SchedulerService.UpdateParams): Promise<void> {
        const { id, scheduleFor } = params;

        // Validate date is in future
        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                {
                    scheduleFor,
                    id
                }
            );
        }

        const client = this.getClient();

        await client.send(
            new UpdateScheduleCommand({
                Name: id,
                ScheduleExpression: this.createScheduleExpression(scheduleFor),
                FlexibleTimeWindow: {
                    Mode: "OFF"
                },
                Target: {
                    Arn: this.config.lambdaArn,
                    RoleArn: this.config.roleArn,
                    Input: this.createScheduledActionEventInput(params)
                },
                ActionAfterCompletion: "DELETE"
            })
        );
    }

    public async delete(params: SchedulerService.DeleteParams): Promise<void> {
        const client = this.getClient();

        const exists = await this.exists(params);
        if (!exists) {
            throw new WebinyError(
                `Cannot delete schedule "${params.id}", tenant "${params.tenant}", because it does not exist.`
            );
        }

        const name = this.createScheduleName(params);

        try {
            await client.send(new DeleteScheduleCommand({ Name: name }));
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return;
            }
            throw WebinyError.from(ex);
        }
    }

    public async exists(params: SchedulerService.ExistsParams): Promise<boolean> {
        const client = this.getClient();

        const name = this.createScheduleName(params);

        try {
            await client.send(new GetScheduleCommand({ Name: name }));
            return true;
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return false;
            }
            throw ex;
        }
    }

    private createScheduleExpression(scheduleFor: Date): string {
        // Format: at(YYYY-MM-DDTHH:mm:ss) - EventBridge expects this format
        return `at(${scheduleFor.toISOString().replace(/\.\d{3}Z$/, "")})`;
    }

    private createScheduledActionEventInput(
        params: ISchedulerServiceCreateParams | ISchedulerServiceUpdateParams
    ): string {
        return JSON.stringify({
            [SCHEDULED_ACTION_EVENT_IDENTIFIER]: this.createScheduledActionEventPayload(params)
        });
    }

    private createScheduledActionEventPayload(
        params: SchedulerService.CreateParams | SchedulerService.UpdateParams
    ): IScheduledActionEventPayload {
        const { id, scheduleFor, tenant, namespace } = params;

        return {
            id,
            tenant,
            namespace,
            scheduleFor: scheduleFor.toISOString()
        };
    }

    private createScheduleName(params: SchedulerService.ExistsParams): string {
        return `schedule_${params.tenant}-${params.namespace}-${params.id}`;
    }
}
