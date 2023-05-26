import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { CmsModelField } from "~/types";

export interface CmsModelFieldValidatorConfigAdapter {
    isRequired(): boolean;
    getName(): string;
    getLabel(): string;
    getDescription(): string;
    getDefaultMessage(): string;
    getDefaultSettings(): Record<string, any> | undefined;
    getVariables(): CmsModelFieldValidatorVariable[];
    getVariableDescription(variableName: string): string | undefined;
}

export interface CmsModelFieldValidatorVariable {
    name: string;
    description: string;
}

/**
 * This interface is used in the validator configuration UI (Field dialog).
 */
export interface CmsModelFieldValidatorConfig {
    name: string;
    required?: boolean;
    label?: string;
    description?: string;
    defaultMessage?: string;
    defaultSettings?: Record<string, any>;
    variables?: CmsModelFieldValidatorVariable[];
}

/**
 * This interface allows you to control the title, description, and validators located in the specific
 * validators group, like `validators` or `listValidators` within the Field dialog.
 */
export interface CmsModelFieldValidatorsGroup {
    validators: (string | CmsModelFieldValidatorConfig)[];
    title?: string;
    description?: string;
}

/**
 * This interface allows you to generate validators based on the field configuration.
 */
export interface CmsModelFieldValidatorsFactory {
    (field: CmsModelField): string[] | CmsModelFieldValidatorsGroup;
}

export interface CmsModelFieldValidator {
    name: string;
    message?: string;
    settings?: any;
}

export interface CmsModelFieldValidatorPlugin<T = any> extends Plugin {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        label: string;
        description: string;
        defaultMessage: string;
        variables?: CmsModelFieldValidatorVariable[];
        defaultSettings?: Record<string, any>;
        getVariableValues?: (context: {
            validator: CmsModelFieldValidator;
        }) => Record<string, string>;
        renderSettings?: (config: CmsModelFieldValidatorConfigAdapter) => React.ReactElement;
        renderCustomUi?: () => React.ReactElement;
        validate: (
            value: T,
            context: {
                validator: CmsModelFieldValidator;
                field: CmsModelField;
            }
        ) => Promise<any>;
    };
}

export interface CmsModelFieldRegexValidatorExpressionPlugin extends Plugin {
    type: "cms-model-field-regex-validator-expression";
    pattern: {
        name: string;
        message: string;
        label: string;
        regex: string;
        flags: string;
    };
}
