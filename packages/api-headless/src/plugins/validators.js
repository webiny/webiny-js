// @flow
import { validation } from "@webiny/validation";
import type { PluginType } from "@webiny/api/types";
import type { Entity } from "@webiny/entity";

type HeadlessFieldValidatorPlugin = PluginType & {
    validatorId: string,
    validate: (
        value: any,
        options: Object,
        { field: Object, entity: Entity, context: Object }
    ) => Promise<void>
};

export default ([
    {
        name: "cms-headless-field-validator-required",
        type: "cms-headless-field-validator",
        validatorId: "required",
        async validate(value, options, { field, entity }) {
            // If it's an existing entity, most likely it already has all the required values.
            // We do this fast check to be sure, and skip validation if value is already set.
            const attribute = entity.getAttribute(field.fieldId);
            if (attribute && (await attribute.getValue())) {
                return;
            }
            await validation.validate(value, "required");
        }
    },
    {
        name: "cms-headless-field-validator-minLength",
        type: "cms-headless-field-validator",
        validatorId: "minLength",
        async validate(value, { min }) {
            await validation.validate(value, `minLength:${min}`);
        }
    }
]: Array<HeadlessFieldValidatorPlugin>);
