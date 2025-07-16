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
import { convertException } from "@webiny/utils";
import type {
    ISchedulerService,
    ISchedulerServiceCreateInput,
    ISchedulerServiceUpdateInput
} from "./types.js";
import { WebinyError } from "@webiny/error";

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

    public async create(params: ISchedulerServiceCreateInput): Promise<void> {
        const { id, dateOn } = params;
        if (dateOn < new Date()) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past: ${dateOn.toISOString()}`,
                "SCHEDULE_DATE_IN_PAST",
                {
                    id,
                    dateOn: dateOn.toISOString()
                }
            );
        }
        const input: CreateScheduleCommandInput = {
            Name: id,
            ScheduleExpression: `at(${dateOn.toISOString()})`,
            FlexibleTimeWindow: {
                Mode: "OFF"
            },
            Target: {
                Arn: this.config.lambdaArn,
                RoleArn: this.config.roleArn,
                Input: JSON.stringify({
                    id
                })
            }
        };
        const command = new CreateScheduleCommand(input);
        try {
            await this.getClient().send(command);
        } catch (ex) {
            this.handleException(ex);
        }
    }

    public async update(params: ISchedulerServiceUpdateInput): Promise<void> {
        const { id, dateOn } = params;
        if (dateOn < new Date()) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past: ${dateOn.toISOString()}`,
                "SCHEDULE_DATE_IN_PAST",
                {
                    id,
                    dateOn: dateOn.toISOString()
                }
            );
        }
        const input: UpdateScheduleCommandInput = {
            Name: id,
            ScheduleExpression: `at(${dateOn.toISOString()})`,
            FlexibleTimeWindow: {
                Mode: "OFF"
            },
            Target: {
                Arn: this.config.lambdaArn,
                RoleArn: this.config.roleArn,
                Input: JSON.stringify({
                    id
                })
            }
        };
        const command = new UpdateScheduleCommand(input);
        try {
            await this.getClient().send(command);
        } catch (ex) {
            this.handleException(ex);
        }
    }

    public async delete(id: string): Promise<void> {
        const exists = await this.exists(id);
        if (!exists) {
            return;
        }

        const input: DeleteScheduleCommandInput = {
            Name: id
        };
        const command = new DeleteScheduleCommand(input);
        try {
            await this.getClient().send(command);
        } catch (ex) {
            this.handleException(ex);
        }
    }

    public async exists(id: string): Promise<boolean> {
        const input: GetScheduleCommandInput = {
            Name: id
        };
        const command = new GetScheduleCommand(input);
        try {
            const result = await this.getClient().send(command);
            return result.$metadata?.httpStatusCode === 200;
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return false;
            }
            this.handleException(ex);
        }
        return false;
    }

    private handleException(ex: Error): void {
        // TODO determine if we want to handle specific exception
        switch (ex.name) {
            case "ConflictException":
                throw ex;
            case "ValidationException":
                throw ex;
            case "AccessDeniedException":
                throw ex;
            case "ThrottlingException":
                throw ex;
            case "ServiceQuotaExceededException":
                throw ex;
            case "InternalServerException":
                throw ex;
        }

        console.error("Unknown error while executing ScheduleClient send.");
        console.log(convertException(ex));

        throw ex;
    }
}

export const createSchedulerService = (params: ISchedulerServiceParams): ISchedulerService => {
    return new SchedulerService(params);
};
