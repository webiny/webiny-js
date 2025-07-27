import { createCacheKey } from "@webiny/utils";
import { LambdaClient, LambdaClientConfig } from "@aws-sdk/client-lambda";

export {
    LambdaClient,
    InvokeCommand,
    GetFunctionConfigurationCommand,
    UpdateFunctionConfigurationCommand,
    UpdateFunctionCodeCommand
} from "@aws-sdk/client-lambda";

export type {
    InvocationType,
    InvokeCommandInput,
    LambdaClientConfig,
    InvokeCommandOutput,
    UpdateFunctionConfigurationCommandInput,
    UpdateFunctionConfigurationCommandOutput,
    UpdateFunctionCodeCommandInput,
    UpdateFunctionCodeCommandOutput
} from "@aws-sdk/client-lambda";

const DEFAULT_CONFIG: LambdaClientConfig = {
    region: process.env.AWS_REGION
};

const lambdaClients: Record<string, LambdaClient> = {};

export const createLambdaClient = (input?: Partial<LambdaClientConfig>): LambdaClient => {
    const config: LambdaClientConfig = {
        ...DEFAULT_CONFIG,
        ...input
    };
    const key = createCacheKey(config);

    if (lambdaClients[key]) {
        return lambdaClients[key];
    }

    const client = new LambdaClient(config);

    lambdaClients[key] = client;

    return client;
};
