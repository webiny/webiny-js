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

export type GenericData = string | number | boolean | null | undefined;

export interface GenericStepFunctionData {
    [key: string]: GenericData | GenericData[];
}

export interface TriggerStepFunctionParams<
    T extends GenericStepFunctionData = GenericStepFunctionData
> extends Partial<Omit<StartExecutionCommandInput, "input">> {
    input: T;
}

const stepFunctionClientsCache = new Map<string, SFNClient>();

const getClient = (initial?: SFNClientConfig): SFNClient => {
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

export const triggerStepFunctionFactory = (config?: SFNClientConfig) => {
    const client = getClient(config);
    return async <T extends GenericStepFunctionData = GenericStepFunctionData>(
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

export const listExecutionsFactory = (config?: SFNClientConfig) => {
    const client = getClient(config);
    return async (params: ListExecutionsCommandInput): Promise<ListExecutionsCommandOutput> => {
        const cmd = new ListExecutionsCommand({
            ...params,
            stateMachineArn: params.stateMachineArn || process.env.BG_TASK_SFN_ARN
        });
        return await client.send(cmd);
    };
};

export const describeExecutionFactory = (config?: SFNClientConfig) => {
    const client = getClient(config);
    return async (
        params: DescribeExecutionCommandInput
    ): Promise<DescribeExecutionCommandOutput> => {
        const cmd = new DescribeExecutionCommand(params);
        return await client.send(cmd);
    };
};
