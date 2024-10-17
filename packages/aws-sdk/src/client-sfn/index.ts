import type {
    DescribeExecutionCommandInput,
    DescribeExecutionCommandOutput,
    ListExecutionsCommandInput,
    ListExecutionsCommandOutput,
    SFNClientConfig as BaseSFNClientConfig,
    StartExecutionCommandInput,
    StartExecutionCommandOutput
} from "@aws-sdk/client-sfn";
import {
    DescribeExecutionCommand,
    ListExecutionsCommand,
    SFNClient,
    SFNServiceException,
    StartExecutionCommand
} from "@aws-sdk/client-sfn";
import { createCacheKey } from "@webiny/utils";
import { GenericRecord } from "@webiny/cli/types";

export {
    SFNClient,
    DescribeExecutionCommand,
    SFNServiceException,
    StartExecutionCommand,
    ListExecutionsCommand
};

export type {
    DescribeExecutionCommandInput,
    DescribeExecutionCommandOutput,
    StartExecutionCommandInput,
    StartExecutionCommandOutput,
    ListExecutionsCommandInput,
    ListExecutionsCommandOutput
};

export interface SFNClientConfig extends BaseSFNClientConfig {
    cache?: boolean;
}

export interface TriggerStepFunctionParams<T extends GenericRecord = GenericRecord>
    extends Partial<Omit<StartExecutionCommandInput, "input">> {
    input: T;
}

const stepFunctionClientsCache = new Map<string, SFNClient>();

export const createStepFunctionClient = (initial?: SFNClientConfig): SFNClient => {
    const config: SFNClientConfig = {
        region: process.env.AWS_REGION,
        ...initial
    };
    const skipCache = config.cache === false;
    delete config.cache;
    if (skipCache) {
        return new SFNClient({
            ...config
        });
    }

    const key = createCacheKey(config);
    if (stepFunctionClientsCache.has(key)) {
        return stepFunctionClientsCache.get(key) as SFNClient;
    }

    return new SFNClient({
        ...config
    });
};

export const triggerStepFunctionFactory = (input?: SFNClient | SFNClientConfig) => {
    const client = input instanceof SFNClient ? input : createStepFunctionClient(input);
    return async <T extends GenericRecord = GenericRecord>(
        params: TriggerStepFunctionParams<T>
    ): Promise<StartExecutionCommandOutput> => {
        const cmd = new StartExecutionCommand({
            ...params,
            stateMachineArn: params.stateMachineArn || process.env.BG_TASK_SFN_ARN,
            name: params.name,
            input: JSON.stringify(params.input)
        });
        return await client.send(cmd);
    };
};

export const listExecutionsFactory = (input?: SFNClient | SFNClientConfig) => {
    const client = input instanceof SFNClient ? input : createStepFunctionClient(input);
    return async (params: ListExecutionsCommandInput): Promise<ListExecutionsCommandOutput> => {
        const cmd = new ListExecutionsCommand({
            ...params,
            stateMachineArn: params.stateMachineArn || process.env.BG_TASK_SFN_ARN
        });
        return await client.send(cmd);
    };
};

export const describeExecutionFactory = (input?: SFNClient | SFNClientConfig) => {
    const client = input instanceof SFNClient ? input : createStepFunctionClient(input);
    return async (
        params: DescribeExecutionCommandInput
    ): Promise<DescribeExecutionCommandOutput> => {
        const cmd = new DescribeExecutionCommand({
            ...params
        });
        return await client.send(cmd);
    };
};
