import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { IUpdateUserActionEvent } from "~/worker/actions/updateUser/types.js";
import { createUpdateUserSchema } from "./updateUserSchema.js";
import type { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { UpdateUser } from "~/worker/actions/updateUser/UpdateUser.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateUpdateUserActionParams {
    getCognitoProvider(region: string): Pick<CognitoIdentityProvider, "send">;
}

export const createUpdateUserAction = (params: ICreateUpdateUserActionParams) => {
    const createUser = new UpdateUser({
        getCognitoProvider: params.getCognitoProvider
    });
    return createWorkerActionPlugin<IUpdateUserActionEvent>({
        name: "sync.worker.action.createUser",
        parse: input => {
            const schema = createUpdateUserSchema();

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
