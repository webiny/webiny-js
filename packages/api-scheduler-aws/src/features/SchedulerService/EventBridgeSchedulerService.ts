import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    type SchedulerClient,
    UpdateScheduleCommand
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/api-scheduler/constants.js";
import type { IScheduledActionEventPayload } from "~/createEventHandler.js";

export interface ISchedulerConfig {
    lambdaArn: string;
    roleArn: string;
}

export class EventBridgeSchedulerService implements SchedulerService.Interface {
    public constructor(
        private getClient: (config?: any) => Pick<SchedulerClient, "send">,
        private config: ISchedulerConfig
    ) {}

    public async create(params: ISchedulerServiceCreateParams): Promise<void> {
        const { id, scheduleFor } = params;

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

        const exists = await this.exists(id);
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
                ActionAfterCompletion: "DELETE"
            })
        );
    }

    public async update(params: ISchedulerServiceUpdateParams): Promise<void> {
        const { id, scheduleFor } = params;

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

    public async delete(id: string): Promise<void> {
        const client = this.getClient();

        const exists = await this.exists(id);
        if (!exists) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        try {
            await client.send(new DeleteScheduleCommand({ Name: id }));
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return;
            }
            throw WebinyError.from(ex);
        }
    }

    public async exists(id: string): Promise<boolean> {
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

    private createScheduleExpression(scheduleFor: Date): string {
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
        params: ISchedulerServiceCreateParams | ISchedulerServiceUpdateParams
    ): IScheduledActionEventPayload {
        const { id, scheduleFor, namespace } = params;

        return {
            id,
            namespace,
            scheduleFor: scheduleFor.toISOString()
        };
    }
}
