import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withPrimaryKey } from "@commodo/fields-storage";
import { withStorage } from "@commodo/fields-storage";
import { withHooks, hasHooks } from "@commodo/hooks";
import { validation } from "@webiny/validation";
import { withFields, string, fields, skipOnPopulate, setOnce } from "@commodo/fields";
import { DefaultLocaleData } from "./models/defaultLocaleData.model";
import { LocaleData } from "./models/localeData.model";

export default () => ({
    name: "context-models",
    type: "context",
    apply(context) {
        const DATA_HOOKS = ["beforeCreate", "beforeDelete", "afterSave"];
        context.models = {
            I18N: compose(
                withName("I18N"),
                withPrimaryKey("PK", "SK"),
                withFields({
                    PK: compose(setOnce(), skipOnPopulate())(string()),
                    SK: compose(setOnce(), skipOnPopulate())(string()),
                    data: fields({
                        validation: validation.create("required"),
                        instanceOf: [LocaleData, DefaultLocaleData, "__type"]
                    })
                }),
                // Enables registering storage hooks ("beforeCreate", "beforeDelete", ...) on "data" field's model instance.
                // We pass the model instance as parent to all registered hook callbacks. This allows us to, for example,
                // fetch the constructor and perform additional database queries, if needed.
                withHooks(instance =>
                    DATA_HOOKS.reduce((hooks, name) => {
                        hooks[name] = () =>
                            hasHooks(instance.data) && instance.data.hook(name, instance);
                        return hooks;
                    }, {})
                ),
                withStorage({
                    maxLimit: 10000,
                    driver: context.commodo.driver
                })
            )()
        };
    }
});
