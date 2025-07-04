import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import type { GenericRecord } from "@webiny/utils";
import { createCacheKey } from "@webiny/utils";

export {
    AdminGetUserCommand,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminCreateUserRequest,
    AdminGetUserRequest,
    CognitoIdentityProvider,
    CognitoIdentityProviderClient
} from "@aws-sdk/client-cognito-identity-provider";

export type {
    ListUsersResponse,
    UserType,
    CognitoIdentityProviderClientConfig,
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    AdminCreateUserCommandInput,
    AdminCreateUserCommandOutput,
    AdminDeleteUserCommandInput,
    AdminDeleteUserCommandOutput
} from "@aws-sdk/client-cognito-identity-provider";

const DEFAULT_CONFIG = {
    region: process.env.AWS_REGION
};

const cache: GenericRecord<string, CognitoIdentityProvider> = {};

export const createCognitoIdentityProviderClient = (
    input?: Partial<CognitoIdentityProviderClientConfig>
) => {
    const config: CognitoIdentityProviderClientConfig = {
        ...DEFAULT_CONFIG,
        ...input
    };
    const key = createCacheKey(config);
    if (cache[key]) {
        return cache[key];
    }
    const client = new CognitoIdentityProvider(config);
    cache[key] = client;
    return client;
};
