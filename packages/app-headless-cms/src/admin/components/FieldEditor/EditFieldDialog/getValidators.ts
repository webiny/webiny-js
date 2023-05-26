import { plugins } from "@webiny/plugins";
import {
    CmsModelField,
    CmsEditorFieldTypePlugin,
    CmsModelFieldValidatorPlugin,
    CmsModelFieldValidatorsGroup,
    CmsModelFieldValidatorConfig,
    CmsModelFieldValidatorsFactory
} from "~/types";
import { CmsModelFieldValidatorConfigAdapter } from "~/utils/CmsModelFieldValidatorConfigAdapter";

export interface Validator {
    optional: boolean;
    validator: CmsModelFieldValidatorPlugin["validator"];
}

const isValidatorDefinition = (obj: unknown): obj is CmsModelFieldValidatorsGroup => {
    return obj ? !Array.isArray(obj) : false;
};

const isValidatorDefinitionFactory = (obj: unknown): obj is CmsModelFieldValidatorsFactory => {
    return typeof obj === "function";
};

interface GetValidatorsParams {
    field: CmsModelField;
    fieldPlugin: CmsEditorFieldTypePlugin;
    key: "validators" | "listValidators";
    defaultValidators: string[];
}

export interface ValidationSection {
    title?: string;
    description?: string;
    validators: CmsModelFieldValidatorConfigAdapter[];
}

const getValidatorPlugin = (name: string) => {
    const plugin = plugins
        .byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator")
        .find(plugin => plugin.validator.name === name);

    if (!plugin) {
        throw new Error(`Missing CMS field validator plugin "${name}"!`);
    }

    return plugin.validator as CmsModelFieldValidatorConfig;
};

const getValidatorConfigs = (
    field: CmsModelField,
    validators: Array<CmsModelFieldValidatorConfig | string>
) => {
    const configs: CmsModelFieldValidatorConfigAdapter[] = [];

    for (const validator of validators) {
        let resolvedValidator;
        if (typeof validator === "string") {
            resolvedValidator = getValidatorPlugin(validator);
        } else {
            resolvedValidator = validator;
        }

        configs.push(new CmsModelFieldValidatorConfigAdapter(field, resolvedValidator));
    }

    return configs;
};

const getValidators = ({
    field,
    fieldPlugin,
    key,
    defaultValidators
}: GetValidatorsParams): ValidationSection => {
    let title = "";
    let description = "";
    let fieldValidators = fieldPlugin.field[key];

    if (isValidatorDefinitionFactory(fieldValidators)) {
        fieldValidators = fieldValidators(field);
    }

    let resolvedValidators: (string | CmsModelFieldValidatorConfig)[] | undefined;
    if (isValidatorDefinition(fieldValidators)) {
        title = fieldValidators.title || "";
        description = fieldValidators.description || "";
        resolvedValidators = fieldValidators.validators;
    } else {
        resolvedValidators = fieldValidators;
    }

    const validators = getValidatorConfigs(field, resolvedValidators || defaultValidators);

    return {
        title,
        description,
        validators
    };
};

export const getListValidators = (field: CmsModelField, fieldPlugin: CmsEditorFieldTypePlugin) => {
    return getValidators({
        field,
        fieldPlugin,
        key: "listValidators",
        defaultValidators: ["minLength", "maxLength"]
    });
};

export const getFieldValidators = (field: CmsModelField, fieldPlugin: CmsEditorFieldTypePlugin) => {
    return getValidators({
        field,
        fieldPlugin,
        key: "validators",
        defaultValidators: []
    });
};
