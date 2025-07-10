import type {
    ICopyUser,
    ICopyUserHandleParams,
    ICreateCognitoIdentityProviderClientCb
} from "./types";
import type { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";
import type { AdminGetUserCommandInput } from "@webiny/aws-sdk/client-cognito-identity-provider";
import { AdminGetUserCommand } from "@webiny/aws-sdk/client-cognito-identity-provider";
import type { ICopyUserLambdaPayload } from "~/types.js";

interface IGetUserParams {
    username: string;
    userPoolId: string;
    region: string;
}

export interface IGetLambdaTriggerCb {
    (): LambdaTrigger<ICopyUserLambdaPayload>;
}

export interface ICopyUserParams {
    createCognitoIdentityProviderClient: ICreateCognitoIdentityProviderClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb;
}

export class CopyUser implements ICopyUser {
    private readonly createCognitoIdentityProviderClient: ICreateCognitoIdentityProviderClientCb;
    private readonly getLambdaTrigger: IGetLambdaTriggerCb;

    public constructor(params: ICopyUserParams) {
        this.createCognitoIdentityProviderClient = params.createCognitoIdentityProviderClient;
        this.getLambdaTrigger = params.getLambdaTrigger;
    }

    public async handle(params: ICopyUserHandleParams): Promise<InvokeCommandOutput | null> {
        const { username, target, source } = params;

        const exists = await this.userExists({
            username,
            userPoolId: target.services.cognitoUserPoolId,
            region: target.region
        });

        return await this.getLambdaTrigger().handle({
            invocationType: "Event",
            payload: {
                /**
                 * We need to be able to create or update a user, depending on whether it already exists in the target user pool.
                 */
                action: exists ? "updateUser" : "createUser",
                username,
                source: {
                    region: source.region,
                    userPoolId: source.services.cognitoUserPoolId
                },
                target: {
                    region: target.region,
                    userPoolId: target.services.cognitoUserPoolId
                }
            }
        });
    }

    private async userExists(params: IGetUserParams): Promise<boolean> {
        const { userPoolId, username, region } = params;

        const provider = this.createCognitoIdentityProviderClient({
            region
        });

        const input: AdminGetUserCommandInput = {
            UserPoolId: userPoolId,
            Username: username
        };
        const cmd = new AdminGetUserCommand(input);
        try {
            const result = await provider.send(cmd);
            return result.$metadata?.httpStatusCode === 200;
        } catch {
            return false;
        }
    }
}
