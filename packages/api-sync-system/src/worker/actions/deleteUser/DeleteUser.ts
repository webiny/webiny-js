import type {
    AdminDeleteUserCommandInput,
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    CognitoIdentityProvider
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";

export interface IDeleteUserParams {
    getCognitoProvider: (
        region: string
    ) => Pick<CognitoIdentityProvider, "adminCreateUser" | "adminGetUser" | "adminDeleteUser">;
}

export interface IDeleteUserDeleteParams {
    username: string;
    region: string;
    userPoolId: string;
}

interface IDeleteUserGetUserParams {
    userPoolId: string;
    username: string;
    provider: Pick<CognitoIdentityProvider, "adminGetUser">;
}

export class DeleteUser {
    private readonly getCognitoProvider: (
        region: string
    ) => Pick<CognitoIdentityProvider, "adminCreateUser" | "adminGetUser" | "adminDeleteUser">;

    public constructor(params: IDeleteUserParams) {
        this.getCognitoProvider = params.getCognitoProvider;
    }

    public async delete(params: IDeleteUserDeleteParams): Promise<void> {
        const { userPoolId, username, region } = params;

        const provider = this.getCognitoProvider(region);
        const user = await this.getUser({
            userPoolId,
            username,
            provider
        });
        if (!user) {
            console.log(`Target user "${username}" does not exist in pool "${userPoolId}".`);
            return;
        }

        const deleteUserInput: AdminDeleteUserCommandInput = {
            UserPoolId: userPoolId,
            Username: username
        };

        try {
            await provider.adminDeleteUser(deleteUserInput);
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

        try {
            const result = await provider.adminGetUser(input);
            if (result.$metadata?.httpStatusCode !== 200) {
                return result;
            }
        } catch (ex) {
            //
        }
        return null;
    }
}
