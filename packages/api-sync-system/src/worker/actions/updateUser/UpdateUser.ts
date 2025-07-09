import type {
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    AdminUpdateUserAttributesCommandInput,
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import {
    AdminGetUserCommand,
    AdminUpdateUserAttributesCommand
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";
import { removeCognitoUserAttributes } from "~/worker/actions/removeCognitoUserAttributes.js";

export interface IUpdateUserParams {
    createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;
}

export interface IUpdateUserUpdateParams {
    username: string;
    sourceRegion: string;
    targetRegion: string;
    sourceUserPoolId: string;
    targetUserPoolId: string;
}

interface IUpdateUserGetUserParams {
    userPoolId: string;
    username: string;
    provider: Pick<CognitoIdentityProvider, "send">;
}

export class UpdateUser {
    private readonly createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;

    public constructor(params: IUpdateUserParams) {
        this.createCognitoProvider = params.createCognitoProvider;
    }

    public async update(params: IUpdateUserUpdateParams): Promise<void> {
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
        if (!targetUser) {
            throw new Error(
                `Target user "${username}" does not exist in pool "${targetUserPoolId}".`
            );
        }

        const input: AdminUpdateUserAttributesCommandInput = {
            UserAttributes: removeCognitoUserAttributes(sourceUser.UserAttributes || []),
            UserPoolId: targetUserPoolId,
            Username: username
        };

        const cmd = new AdminUpdateUserAttributesCommand(input);

        try {
            await targetProvider.send(cmd);
        } catch (ex) {
            console.error(
                `Failed to update user "${username}" in pool "${targetUserPoolId}". More info in next log line.`
            );
            console.log(convertException(ex));
        }
    }

    private async getUser(
        params: IUpdateUserGetUserParams
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
