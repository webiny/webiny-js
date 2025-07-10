import {
    AdminDeleteUserCommand,
    type AdminDeleteUserCommandInput,
    AdminGetUserCommand,
    type AdminGetUserCommandInput,
    type AdminGetUserCommandOutput,
    type CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";

export interface IDeleteUserParams {
    createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;
}

export interface IDeleteUserDeleteParams {
    username: string;
    region: string;
    userPoolId: string;
}

interface IDeleteUserGetUserParams {
    userPoolId: string;
    username: string;
    provider: Pick<CognitoIdentityProvider, "send">;
}

export class DeleteUser {
    private readonly createCognitoProvider: (
        config: Partial<CognitoIdentityProviderClientConfig>
    ) => Pick<CognitoIdentityProvider, "send">;

    public constructor(params: IDeleteUserParams) {
        this.createCognitoProvider = params.createCognitoProvider;
    }

    public async delete(params: IDeleteUserDeleteParams): Promise<void> {
        const { userPoolId, username, region } = params;

        const provider = this.createCognitoProvider({
            region
        });
        const user = await this.getUser({
            userPoolId,
            username,
            provider
        });
        if (!user) {
            console.log(`Target user "${username}" does not exist in pool "${userPoolId}".`);
            return;
        }

        const input: AdminDeleteUserCommandInput = {
            UserPoolId: userPoolId,
            Username: username
        };

        const cmd = new AdminDeleteUserCommand(input);
        try {
            await provider.send(cmd);
        } catch (ex) {
            console.error(
                `Failed to delete user "${username}" in pool "${userPoolId}". More info in next log line.`
            );
            console.log(convertException(ex));
        }
    }

    private async getUser(
        params: IDeleteUserGetUserParams
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
