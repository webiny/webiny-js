import type {
    AdminCreateUserCommandInput,
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import {
    AdminCreateUserCommand,
    AdminGetUserCommand
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";
import { removeCognitoUserAttributes } from "~/worker/actions/removeCognitoUserAttributes.js";

export interface ICreateUserParams {
    createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;
}

export interface ICreateUserCreateParams {
    username: string;
    sourceRegion: string;
    targetRegion: string;
    sourceUserPoolId: string;
    targetUserPoolId: string;
}

interface ICreateUserGetUserParams {
    userPoolId: string;
    username: string;
    provider: Pick<CognitoIdentityProvider, "send">;
}

export class CreateUser {
    private readonly createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;

    public constructor(params: ICreateUserParams) {
        this.createCognitoProvider = params.createCognitoProvider;
    }

    public async create(params: ICreateUserCreateParams): Promise<void> {
        const { sourceUserPoolId, targetUserPoolId, username, targetRegion, sourceRegion } = params;

        const sourceProvider = this.createCognitoProvider({
            region: sourceRegion
        });

        const sourceUser = await this.getUser({
            userPoolId: sourceUserPoolId,
            username,
            provider: sourceProvider
        });
        if (!sourceUser) {
            throw new Error(`Source user "${username}" not found in pool "${sourceUserPoolId}".`);
        }
        const targetProvider = this.createCognitoProvider({
            region: targetRegion
        });
        const targetUser = await this.getUser({
            userPoolId: targetUserPoolId,
            username,
            provider: targetProvider
        });
        if (targetUser) {
            console.log(`Target user "${username}" already exists in pool "${targetUserPoolId}".`);
            return;
        }
        /**
         * TODO: verify that this is everything that is required to create a user.
         * We cannot just spread the sourceUser as it causes an exception:
         * `Cannot modify the non-mutable attribute sub`
         */
        const input: AdminCreateUserCommandInput = {
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            UserAttributes: removeCognitoUserAttributes(sourceUser.UserAttributes || []),
            UserPoolId: targetUserPoolId,
            Username: username
        };

        const cmd = new AdminCreateUserCommand(input);

        try {
            await targetProvider.send(cmd);
        } catch (ex) {
            console.error(
                `Failed to create user "${username}" in pool "${targetUserPoolId}". More info in next log line.`
            );
            console.log(convertException(ex));
        }
    }

    private async getUser(
        params: ICreateUserGetUserParams
    ): Promise<AdminGetUserCommandOutput | null> {
        const { userPoolId, username, provider } = params;
        const input: AdminGetUserCommandInput = {
            UserPoolId: userPoolId,
            Username: username
        };

        const cmd = new AdminGetUserCommand(input);

        try {
            const result = await provider.send(cmd);
            if (result.$metadata?.httpStatusCode === 200) {
                return result;
            }
        } catch (ex) {
            //
        }
        return null;
    }
}
