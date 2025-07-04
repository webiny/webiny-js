import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";
import type { ICopyUserActionEvent } from "~/worker/actions/copyUser/types.js";
import { createCopyUserSchema } from "./copyUserSchema.js";
import type { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CopyUser } from "~/worker/actions/copyUser/CopyUser.js";
import { logValidationError } from "~/worker/actions/logValidationError.js";

export interface ICreateCopyUserActionParams {
    getCognitoProvider(
        region: string
    ): Pick<CognitoIdentityProvider, "adminCreateUser" | "adminGetUser" | "adminDeleteUser">;
}

export const createCopyUserAction = (params: ICreateCopyUserActionParams) => {
    const copyUser = new CopyUser({
        getCognitoProvider: params.getCognitoProvider
    });
    return createWorkerActionPlugin<ICopyUserActionEvent>({
        name: "sync.worker.action.copyUser",
        parse: input => {
            const schema = createCopyUserSchema();

            const result = schema.safeParse(input);
            if (!result.success || result.error) {
                logValidationError(result.error);
                return undefined;
            }
            return result.data;
        },
        async handle(params) {
            const { data } = params;
            return copyUser.copy({
                username: data.username,
                sourceRegion: data.source.region,
                sourceUserPoolId: data.source.userPoolId,
                targetRegion: data.target.region,
                targetUserPoolId: data.target.userPoolId
            });
        }
    });
};
