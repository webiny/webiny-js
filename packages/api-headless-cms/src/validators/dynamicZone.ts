import { CmsModelFieldValidatorPlugin } from "~/types";

export const createDynamicZoneValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-dynamic-zone",
        validator: {
            name: "dynamicZone",
            validate() {
                // TODO: implement validation.
                return Promise.resolve(true);
            }
        }
    };
};
