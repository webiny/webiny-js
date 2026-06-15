import { createAbstraction } from "@webiny/feature/api";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import type {
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import type { Plugin } from "@webiny/plugins/types.js";

export interface ISyncWorkerConfig {
    createS3Client(config: S3ClientConfig): Pick<S3Client, "send">;
    createCognitoIdentityProviderClient(
        config: CognitoIdentityProviderClientConfig
    ): Pick<CognitoIdentityProvider, "send">;
    plugins?: Plugin[];
}

export const SyncWorkerConfig = createAbstraction<ISyncWorkerConfig>("SyncWorkerConfig");
