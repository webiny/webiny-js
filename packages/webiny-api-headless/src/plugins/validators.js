import { validation } from "webiny-validation";

export default [
    {
        name: "cms-headless-field-validator-required",
        type: "cms-headless-field-validator",
        validatorId: "required",
        async validate(value, { field, entry }) {
            // If it's an existing entry, most likely it already has all the required values.
            // We do this fast check to be sure, and to skip validation if value is already set.
            if (entry && entry[field.fieldId]) {
                return;
            }
            await validation.validate(value, "required");
        }
    }
];