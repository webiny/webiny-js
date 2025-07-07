import {
    AdminCreateUserCommand,
    type AdminCreateUserRequest,
    AdminGetUserCommand,
    type AdminGetUserCommandInput,
    type AdminGetUserCommandOutput,
    type CognitoIdentityProvider
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { convertException } from "@webiny/utils/exception.js";

export interface ICreateUserParams {
    getCognitoProvider: (region: string) => Pick<CognitoIdentityProvider, "send">;
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
    private readonly getCognitoProvider: (region: string) => Pick<CognitoIdentityProvider, "send">;

    public constructor(params: ICreateUserParams) {
        this.getCognitoProvider = params.getCognitoProvider;
    }

    public async create(params: ICreateUserCreateParams): Promise<void> {
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

        const cmd = new AdminCreateUserCommand(createUserInput);

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
