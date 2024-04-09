// @ts-expect-error Package @commodo/fields does not have types.
import { string, withFields } from "@commodo/fields";
// @ts-expect-error Package commodo-fields-object does not have types.
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { AdminUsers } from "~/types";

const CreateUserDataModel = withFields({
    id: string({ validation: validation.create("minLength:1") }),
    displayName: string({ validation: validation.create("minLength:1") }),

    // We did not use an e-mail validator here, just because external
    // IdPs (Okta, Auth0) do not require e-mail to be present. When creating
    // admin users, they're actually passing the user's ID as the e-mail.
    // For example: packages/api-security-okta/src/createAdminUsersHooks.ts:13
    // In the future, we might want to rename this field to `idpId` or similar.
    email: string({ validation: validation.create("required") }),

    firstName: string({ validation: validation.create("minLength:1") }),
    lastName: string({ validation: validation.create("minLength:1") }),
    avatar: object()
})();

const UpdateUserDataModel = withFields({
    displayName: string({ validation: validation.create("minLength:1") }),
    avatar: object(),
    firstName: string({ validation: validation.create("minLength:1") }),
    lastName: string({ validation: validation.create("minLength:1") }),
    group: string(),
    team: string()
})();

export const attachUserValidation = (
    params: Pick<AdminUsers, "onUserBeforeCreate" | "onUserBeforeUpdate">
) => {
    const { onUserBeforeCreate, onUserBeforeUpdate } = params;
    onUserBeforeCreate.subscribe(async ({ inputData }) => {
        const model = await new CreateUserDataModel().populate(inputData);
        await model.validate();
    });

    onUserBeforeUpdate.subscribe(async ({ inputData }) => {
        const model = await new UpdateUserDataModel().populate(inputData);
        await model.validate();
    });
};
