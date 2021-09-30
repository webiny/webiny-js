import { string, withFields } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { AdminUsers } from "~/types";

const CreateUserDataModel = withFields({
    id: string({ validation: validation.create("required") }),
    email: string({ validation: validation.create("required,minLength:2") }),
    firstName: string({ validation: validation.create("required,minLength:2") }),
    lastName: string({ validation: validation.create("required,minLength:2") }),
    avatar: object()
})();

const UpdateUserDataModel = withFields({
    avatar: object(),
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") }),
    group: string()
})();

export const attachUserValidation = (adminUsers: AdminUsers) => {
    adminUsers.onUserBeforeCreate.subscribe(async ({ inputData }) => {
        const model = await new CreateUserDataModel().populate(inputData);
        await model.validate();
    });

    adminUsers.onUserBeforeUpdate.subscribe(async ({ inputData }) => {
        const model = await new UpdateUserDataModel().populate(inputData);
        await model.validate();
    });
};
