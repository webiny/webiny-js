import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withPrimaryKey, withKey } from "@commodo/fields-storage";
import { withStorage } from "@commodo/fields-storage";
import { withHooks, hasHooks } from "@commodo/hooks";
import { validation } from "@webiny/validation";
import { withFields, string, fields, skipOnPopulate, setOnce } from "@commodo/fields";

const DATA_HOOKS = ["beforeCreate", "beforeDelete", "beforeSave", "afterSave"];

export default ({ context }) =>
    compose(
        withName("SECURITY"),
        withPrimaryKey("PK", "SK"),
        withKey({
            name: "GSI1",
            fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }],
            unique: true
        }),
        withFields({
            PK: compose(setOnce(), skipOnPopulate())(string()),
            SK: compose(setOnce(), skipOnPopulate())(string()),
            GSI1_PK: string(),
            GSI1_SK: string(),
            GSI_DATA: fields({
                validation: validation.create("required"),
                instanceOf: [
                    context.models.SecurityUser,
                    context.models.SecurityGroup,
                    context.models.SecurityPersonalAccessToken,
                    "__type"
                ]
            }),
            data: fields({
                validation: validation.create("required"),
                instanceOf: [
                    context.models.SecurityUser,
                    context.models.SecurityGroup,
                    context.models.SecurityPersonalAccessToken,
                    "__type"
                ]
            })
        }),
        // Enables registering storage hooks ("beforeCreate", "beforeDelete", ...) on "data" field's model instance.
        // We pass the model instance as parent to all registered hook callbacks. This allows us to, for example,
        // fetch the constructor and perform additional database queries, if needed.
        withHooks(instance =>
            DATA_HOOKS.reduce((hooks, name) => {
                hooks[name] = () => hasHooks(instance.data) && instance.data.hook(name, instance);
                return hooks;
            }, {})
        ),
        withStorage({
            maxLimit: 10000,
            driver: context.commodo.driver
        })
    )();
