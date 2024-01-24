import {
    SFNClient,
    SFNClientConfig,
    StartExecutionCommand,
    StartExecutionCommandInput
} from "@aws-sdk/client-sfn";

export { SFNClient, StartExecutionCommand, SFNServiceException } from "@aws-sdk/client-sfn";

export type GenericData = string | number | boolean | null | undefined;

export interface GenericStepFunctionData {
    [key: string]: GenericData | GenericData[];
}

export interface TriggerStepFunctionParams<
    T extends GenericStepFunctionData = GenericStepFunctionData
> extends Partial<Omit<StartExecutionCommandInput, "input">> {
    input: T;
}

const getClient = (config: SFNClient | SFNClientConfig): SFNClient => {
    if (config instanceof SFNClient) {
        return config;
    }
    return new SFNClient({
        ...config,
        region: config.region || process.env.AWS_REGION
    });
};

export const triggerStepFunctionFactory = (config: SFNClient | SFNClientConfig) => {
    const client = getClient(config);
    return async <T extends GenericStepFunctionData = GenericStepFunctionData>(
        params: TriggerStepFunctionParams<T>
    ) => {
        const cmd = new StartExecutionCommand({
            ...params,
            stateMachineArn: params.stateMachineArn || process.env.BG_TASK_SFN_ARN,
            name: params.name,
            input: JSON.stringify(params.input)
        });
        return await client.send(cmd);
    };
};
