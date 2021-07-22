import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import { UserPlugin } from "~/plugins/UserPlugin";

const CreateUserDataModel = withFields({
    login: string({ validation: validation.create("required,minLength:2") }),
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

export default new UserPlugin({
    async beforeCreate({ inputData }) {
        const model = await new CreateUserDataModel().populate(inputData);
        await model.validate();
    },
    async beforeUpdate({ inputData }) {
        const model = await new UpdateUserDataModel().populate(inputData);
        await model.validate();
    }
});
