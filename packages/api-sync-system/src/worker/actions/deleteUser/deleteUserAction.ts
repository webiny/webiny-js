import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { IDeleteUserActionEvent } from "./types.js";
import { createDeleteUserSchema } from "./deleteUserSchema.js";
import type {
    CognitoIdentityProvider,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { DeleteUser } from "./DeleteUser.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateDeleteUserActionParams {
    createCognitoProvider(
        config: Partial<CognitoIdentityProviderClientConfig>
    ): Pick<CognitoIdentityProvider, "send">;
}

export const createDeleteUserAction = (params: ICreateDeleteUserActionParams) => {
    const deleteUser = new DeleteUser({
        createCognitoProvider: params.createCognitoProvider
    });
    return createWorkerActionPlugin<IDeleteUserActionEvent>({
        name: "sync.worker.action.deleteUser",
        parse: input => {
            const schema = createDeleteUserSchema();

            const result = schema.safeParse(input);
            if (!result.success || result.error) {
                logValidationError(result.error);
                return undefined;
            }
            return result.data;
        },
        async handle(params) {
            const { data } = params;
            return deleteUser.delete({
                username: data.username,
                region: data.target.region,
                userPoolId: data.target.userPoolId
            });
        }
    });
};
