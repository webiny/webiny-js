import type {
    CreateScheduleCommandInput,
    DeleteScheduleCommandInput,
    GetScheduleCommandInput,
    SchedulerClient,
    SchedulerClientConfig,
    UpdateScheduleCommandInput
} from "@webiny/aws-sdk/client-scheduler/index.js";
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    UpdateScheduleCommand
} from "@webiny/aws-sdk/client-scheduler/index.js";
import type {
    ISchedulerService,
    ISchedulerServiceCreateInput,
    ISchedulerServiceCreateResponse,
    ISchedulerServiceDeleteResponse,
    ISchedulerServiceUpdateInput,
    ISchedulerServiceUpdateResponse
} from "./types.js";
import { WebinyError } from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { dateInTheFuture } from "~/utils/dateInTheFuture.js";
import { SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { IWebinyScheduledCmsActionEventValues } from "~/handler/Handler.js";
import { parseIdentifier } from "@webiny/utils";

export interface ISchedulerServiceParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
    config: ISchedulerServiceConfig;
}

export interface ISchedulerServiceConfig {
    lambdaArn: string;
    roleArn: string;
}

export class SchedulerService implements ISchedulerService {
    private readonly getClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;
    private readonly config: ISchedulerServiceConfig;

    public constructor(params: ISchedulerServiceParams) {
        this.getClient = params.getClient;
        this.config = params.config;
    }

    public async create(
        params: ISchedulerServiceCreateInput
    ): Promise<ISchedulerServiceCreateResponse> {
        const { id: initialId, scheduleOn } = params;

        const { id } = parseIdentifier(initialId);

        if (dateInTheFuture(scheduleOn) === false) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past: ${scheduleOn.toISOString()}`,
                "SCHEDULE_DATE_IN_PAST",
                {
                    id,
                    dateOn: scheduleOn.toISOString()
                }
            );
        }
        /**
         * There is a possibility that the schedule already exists, in which case we will just update it.
         *
         * TODO determine if we want to allow this behavior - or throw an error if the schedule already exists.
         */
        const exists = await this.exists(id);
        if (exists) {
            return this.update(params);
        }
        const input: CreateScheduleCommandInput = this.getInput(id, scheduleOn);
        const command = new CreateScheduleCommand(input);
        try {
            return await this.getClient().send(command);
        } catch (ex) {
            console.error(ex);
            throw WebinyError.from(ex);
        }
    }

    public async update(
        params: ISchedulerServiceUpdateInput
    ): Promise<ISchedulerServiceUpdateResponse> {
        const { id: initialId, scheduleOn } = params;

        const { id } = parseIdentifier(initialId);

        if (dateInTheFuture(scheduleOn) === false) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past: ${scheduleOn.toISOString()}`,
                "SCHEDULE_DATE_IN_PAST",
                {
                    id,
                    dateOn: scheduleOn.toISOString()
                }
            );
        }
        /**
         * If the schedule does not exist, we cannot update it.
         *
         * TODO determine if we want to create a new schedule in this case, or return the error.
         */
        const exists = await this.exists(id);
        if (!exists) {
            throw new NotFoundError(`Cannot update schedule "${id}" because it does not exist.`);
        }
        const input: UpdateScheduleCommandInput = this.getInput(id, scheduleOn);
        const command = new UpdateScheduleCommand(input);
        try {
            return await this.getClient().send(command);
        } catch (ex) {
            throw WebinyError.from(ex);
        }
    }

    public async delete(initialId: string): Promise<ISchedulerServiceDeleteResponse> {
        const { id } = parseIdentifier(initialId);

        const exists = await this.exists(id);
        if (!exists) {
            throw new NotFoundError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        const input: DeleteScheduleCommandInput = {
            Name: id
        };
        const command = new DeleteScheduleCommand(input);
        try {
            return await this.getClient().send(command);
        } catch (ex) {
            throw WebinyError.from(ex);
        }
    }

    public async exists(initialId: string): Promise<boolean> {
        const { id } = parseIdentifier(initialId);

        const input: GetScheduleCommandInput = {
            Name: id
        };
        const command = new GetScheduleCommand(input);
        try {
            const result = await this.getClient().send(command);
            return result.$metadata?.httpStatusCode === 200;
        } catch (ex) {
            return false;
        }
    }

    private createScheduleExpression(input: Date): string {
        return `at(${this.getTimeAt(input)})`;
    }

    private getTimeAt(input: Date): string {
        return input.toISOString().replace(".000Z", "");
    }

    private getInput(
        initialId: string,
        scheduleOn: Date
    ): CreateScheduleCommandInput | UpdateScheduleCommandInput {
        const { id } = parseIdentifier(initialId);

        const values: IWebinyScheduledCmsActionEventValues = {
            id,
            scheduleOn: scheduleOn.toISOString()
        };
        return {
            Name: id,
            ActionAfterCompletion: "DELETE",
            ScheduleExpression: this.createScheduleExpression(scheduleOn),
            FlexibleTimeWindow: {
                Mode: "OFF"
            },
            Target: {
                Arn: this.config.lambdaArn,
                RoleArn: this.config.roleArn,
                Input: JSON.stringify({
                    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: values
                })
            }
        };
    }
}

export const createSchedulerService = (params: ISchedulerServiceParams): ISchedulerService => {
    return new SchedulerService(params);
};
