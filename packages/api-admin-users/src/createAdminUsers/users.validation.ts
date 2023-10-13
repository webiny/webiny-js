/**
 * Package @commodo/fields does not have types
 */
// @ts-ignore
import { string, withFields } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { AdminUsers } from "~/types";

const CreateUserDataModel = withFields({
    id: string({ validation: validation.create("minLength:2") }),
    displayName: string({ validation: validation.create("minLength:2") }),
    email: string({ validation: validation.create("minLength:2") }),
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") }),
    avatar: object()
})();

const UpdateUserDataModel = withFields({
    id: string({ validation: validation.create("minLength:2") }),
    displayName: string({ validation: validation.create("minLength:2") }),
    avatar: object(),
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") }),
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
