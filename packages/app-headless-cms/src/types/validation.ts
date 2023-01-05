import * as React from "react";
import { Plugin } from "@webiny/plugins/types";

import { CmsEditorFieldValidatorConfig } from "~/utils/CmsEditorFieldValidatorConfig";
import { CmsModelField } from "~/types";

export interface CmsEditorFieldValidatorVariable {
    name: string;
    description: string;
}

export interface CmsEditorFieldValidatorDefinition {
    name: string;
    label: string;
    description: string;
    defaultMessage: string;
    variables: CmsEditorFieldValidatorVariable[];
}

export interface CmsEditorFieldValidatorsDefinition {
    validators: (string | CmsEditorFieldValidatorDefinition)[];
    title?: string;
    description?: string;
}

export interface CmsEditorFieldValidatorsFactory {
    (field: CmsModelField): string[] | CmsEditorFieldValidatorsDefinition;
}

export interface CmsEditorFieldValidator {
    name: string;
    message?: string;
    settings?: any;
}

export interface CmsEditorFieldValidatorPluginValidator {
    name: string;
    label: string;
    description: string;
    defaultMessage: string;
    defaultSettings?: Record<string, any>;
    variables?: CmsEditorFieldValidatorVariable[];
    renderSettings?: (config: CmsEditorFieldValidatorConfig) => React.ReactElement;
    renderCustomUi?: () => React.ReactElement;
}
export interface CmsEditorFieldValidatorPlugin extends Plugin {
    type: "cms-editor-field-validator";
    validator: CmsEditorFieldValidatorPluginValidator;
}

export interface CmsEditorFieldValidatorPatternPlugin extends Plugin {
    type: "cms-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
}

export interface CmsFieldValidator {
    name: string;
    message?: string;
    settings?: any;
}

export interface CmsModelFieldValidatorPlugin<T = any> extends Plugin {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate: (value: T, validator: CmsFieldValidator, field: CmsModelField) => Promise<any>;
    };
}

/**
 * @category Plugin
 * @category ContentModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorPatternPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-validator-pattern";
    /**
     * A pattern object for the validator.
     */
    pattern: {
        /**
         * name of the pattern.
         */
        name: string;
        /**
         * RegExp of the validator.
         */
        regex: string;
        /**
         * RegExp flags
         */
        flags: string;
    };
}
