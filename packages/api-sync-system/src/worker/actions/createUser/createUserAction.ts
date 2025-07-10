import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { ICreateUserActionEvent } from "~/worker/actions/createUser/types.js";
import { createCreateUserSchema } from "./createUserSchema.js";
import type {
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CreateUser } from "~/worker/actions/createUser/CreateUser.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateCreateUserActionParams {
    createCognitoProvider(
        config: Partial<CognitoIdentityProviderClientConfig>
    ): Pick<CognitoIdentityProvider, "send">;
}

export const createCreateUserAction = (params: ICreateCreateUserActionParams) => {
    const createUser = new CreateUser({
        createCognitoProvider: params.createCognitoProvider
    });
    return createWorkerActionPlugin<ICreateUserActionEvent>({
        name: "sync.worker.action.createUser",
        parse: input => {
            const schema = createCreateUserSchema();

            const result = schema.safeParse(input);
            if (!result.success || result.error) {
                logValidationError(result.error);
                return undefined;
            }
            return result.data;
        },
        async handle(params) {
            const { data } = params;
            return createUser.create({
                username: data.username,
                sourceRegion: data.source.region,
                sourceUserPoolId: data.source.userPoolId,
                targetRegion: data.target.region,
                targetUserPoolId: data.target.userPoolId
            });
        }
    });
};
