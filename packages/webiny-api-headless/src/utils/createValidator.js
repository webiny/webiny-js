import { getPlugins } from "webiny-plugins";

export default ({ field, entity, context }) => {
    const fieldValidatorPlugins = getPlugins("cms-headless-field-validator");

    return async value => {
        for (let i = 0; i < field.validation.length; i++) {
            const { id, ...options } = field.validation[i];
            const validatorPlugin = fieldValidatorPlugins.find(pl => pl.validatorId === id);

            if (!validatorPlugin) {
                throw Error(`Validator plugin for "${id}" was not found!`);
            }

            try {
                await validatorPlugin.validate(value, options, {
                    field,
                    entity,
                    context
                });
            } catch (err) {
                err.message = options.message;
                throw err;
            }
        }
    };
};
