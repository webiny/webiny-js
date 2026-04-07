import type { Plugin } from "@webiny/plugins/types.js";
import type { CmsModelFieldValidatorValidateParams } from "./types.js";

/**
 * Definition for the field validator.
 *
 * @category Plugin
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorPluginValidateCb {
    (params: CmsModelFieldValidatorValidateParams): Promise<boolean>;
}

export interface CmsModelFieldValidatorPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-model-field-validator";
    /**
     * Actual validator definition.
     */
    validator: {
        /**
         * Name of the validator.
         */
        name: string;
        /**
         * Validation method.
         */
        validate: CmsModelFieldValidatorPluginValidateCb;
    };
}

