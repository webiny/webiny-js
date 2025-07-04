import type {
    AdminCreateUserRequest,
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    CognitoIdentityProvider
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";

export interface ICopyUserParams {
    getCognitoProvider: (
        region: string
    ) => Pick<CognitoIdentityProvider, "adminCreateUser" | "adminGetUser" | "adminDeleteUser">;
}

export interface ICopyUserCopyParams {
    username: string;
    sourceRegion: string;
    targetRegion: string;
    sourceUserPoolId: string;
    targetUserPoolId: string;
}

interface ICopyUserGetUserParams {
    userPoolId: string;
    username: string;
    provider: Pick<CognitoIdentityProvider, "adminGetUser">;
}

export class CopyUser {
    private readonly getCognitoProvider: (
        region: string
    ) => Pick<CognitoIdentityProvider, "adminCreateUser" | "adminGetUser" | "adminDeleteUser">;

    public constructor(params: ICopyUserParams) {
        this.getCognitoProvider = params.getCognitoProvider;
    }

    public async copy(params: ICopyUserCopyParams): Promise<void> {
        const { sourceUserPoolId, targetUserPoolId, username, targetRegion, sourceRegion } = params;

        const sourceProvider = this.getCognitoProvider(sourceRegion);

        const sourceUser = await this.getUser({
            userPoolId: sourceUserPoolId,
            username,
            provider: sourceProvider
        });
        if (!sourceUser) {
            throw new Error(`Source user "${username}" not found in pool "${sourceUserPoolId}".`);
        }
        const targetProvider = this.getCognitoProvider(targetRegion);
        const targetUser = await this.getUser({
            userPoolId: targetUserPoolId,
            username,
            provider: targetProvider
        });
        if (targetUser) {
            console.log(`Target user "${username}" already exists in pool "${targetUserPoolId}".`);
            return;
        }

        const createUserInput: AdminCreateUserRequest = {
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            ...sourceUser,
            UserPoolId: targetUserPoolId,
            Username: username
        };

        try {
            await targetProvider.adminCreateUser(createUserInput);
        } catch (ex) {
            console.error(
                `Failed to create user "${username}" in pool "${targetUserPoolId}". More info in next log line.`
            );
            console.log(convertException(ex));
        }
    }

    private async getUser(
        params: ICopyUserGetUserParams
    ): Promise<AdminGetUserCommandOutput | null> {
        const { userPoolId, username, provider } = params;
        const input: AdminGetUserCommandInput = {
            UserPoolId: userPoolId,
            Username: username
        };

        try {
            const result = await provider.adminGetUser(input);
            if (result.$metadata?.httpStatusCode === 200) {
                return result;
            }
        } catch (ex) {
            //
        }
        return null;
    }
}
