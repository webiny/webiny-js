import { createAbstraction } from "@webiny/feature/api";
import type {
    DynamoDBClientConfig,
    DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { LambdaClient, LambdaClientConfig } from "@webiny/aws-sdk/client-lambda/index.js";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type {
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import type { TransformRecordPlugin } from "./plugins/TransformRecordPlugin.js";
import type { CommandHandlerPlugin } from "./plugins/CommandHandlerPlugin.js";

export type AllowedResolverPlugins = TransformRecordPlugin | CommandHandlerPlugin;

export interface ISyncResolverConfig {
    tableName?: string;
    awsWorkerLambdaArn?: string;
    createDocumentClient(params: Partial<DynamoDBClientConfig>): Pick<DynamoDBDocument, "send">;
    createLambdaClient?(config: Partial<LambdaClientConfig>): Pick<LambdaClient, "send">;
    createS3Client?(config: S3ClientConfig): Pick<S3Client, "send">;
    createCognitoIdentityProviderClient?(
        config: Partial<CognitoIdentityProviderClientConfig>
    ): Pick<CognitoIdentityProvider, "send">;
    plugins?: AllowedResolverPlugins[];
}

export const SyncResolverConfig = createAbstraction<ISyncResolverConfig>("SyncResolverConfig");
