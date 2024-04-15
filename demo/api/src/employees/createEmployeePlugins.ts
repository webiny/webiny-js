import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider";
import Error from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { Context } from "../types";
import { CognitoEmailIsTaken } from "./CognitoEmailIsTaken";
import { CreateCognitoUser } from "./CreateCognitoUser";
import { UpdateCognitoUser } from "./UpdateCognitoUser";
import { DeleteCognitoUser } from "./DeleteCognitoUser";
import { DisableCognitoUser } from "./DisableCognitoUser";

interface CognitoParams {
    region: string;
    userPoolId: string;
}

export const createEmployeePlugins = ({ region, userPoolId }: CognitoParams) => {
    const cognito = new CognitoIdentityProvider({ region });

    return new ContextPlugin<Context>(({ cms }) => {
        cms.onEntryBeforeCreate.subscribe(async ({ model, entry, input }) => {
            if (model.modelId !== "employee") {
                return;
            }

            delete entry.values["password"];

            const emailIsTakenUseCase = new CognitoEmailIsTaken(cognito, userPoolId);
            const isEmailTaken = await emailIsTakenUseCase.execute(input.email);

            if (isEmailTaken) {
                throw new Error({
                    code: "COGNITO_EMAIL_TAKEN",
                    message: "Employee with this email already exists."
                });
            }
        });

        cms.onEntryAfterCreate.subscribe(async ({ model, entry, input }) => {
            if (model.modelId !== "employee") {
                return;
            }

            const createUserUseCase = new CreateCognitoUser(cognito, userPoolId);
            await createUserUseCase.execute({
                id: entry.entryId,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                password: input.password
            });
        });

        cms.onEntryBeforeUpdate.subscribe(async ({ model, entry }) => {
            if (model.modelId !== "employee") {
                return;
            }

            delete entry.values["password"];
        });

        cms.onEntryAfterUpdate.subscribe(async ({ model, entry, input }) => {
            if (model.modelId !== "employee") {
                return;
            }

            const updateUserUseCase = new UpdateCognitoUser(cognito, userPoolId);
            await updateUserUseCase.execute({
                id: entry.entryId,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                password: input.password || ""
            });
        });

        cms.onEntryAfterDelete.subscribe(async ({ model, entry, permanent }) => {
            if (model.modelId !== "employee") {
                return;
            }

            const email = entry.values["email"] as string;

            try {
                if (permanent) {
                    const deleteUserUseCase = new DeleteCognitoUser(cognito, userPoolId);
                    return deleteUserUseCase.execute(email);
                }

                const disableUserUseCase = new DisableCognitoUser(cognito, userPoolId);
                return disableUserUseCase.execute(email);
            } catch (e) {
                console.log(e);
            }
        });
    });
};
