import { plugins } from "@webiny/plugins";
import {
    CmsModelField,
    CmsEditorFieldTypePlugin,
    CmsEditorFieldValidatorPlugin,
    CmsEditorFieldValidatorsDefinition
} from "~/types";

export interface Validator {
    optional: boolean;
    validator: CmsEditorFieldValidatorPlugin["validator"];
}

const isValidatorDefinition = (obj: unknown): obj is CmsEditorFieldValidatorsDefinition => {
    return obj ? !Array.isArray(obj) : false;
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
    validators: Validator[];
}

const getValidators = ({
    field,
    fieldPlugin,
    key,
    defaultValidators
}: GetValidatorsParams): ValidationSection => {
    let title,
        description,
        fieldValidators = fieldPlugin.field[key];

    if (typeof fieldValidators === "function") {
        fieldValidators = fieldValidators(field);
    }

    if (isValidatorDefinition(fieldValidators)) {
        title = fieldValidators.title;
        description = fieldValidators.description;
        fieldValidators = fieldValidators.validators;
    }

    const allowedValidators = fieldValidators || defaultValidators;

    const mappedValidators = plugins
        .byType<CmsEditorFieldValidatorPlugin>("cms-editor-field-validator")
        .reduce((acc, { validator }) => {
            if (allowedValidators.includes(validator.name)) {
                return [
                    ...acc,
                    {
                        optional: true,
                        validator
                    }
                ];
            } else if (allowedValidators.includes(`!${validator.name}`)) {
                return [
                    ...acc,
                    {
                        optional: false,
                        validator
                    }
                ];
            }

            return acc;
        }, [] as Validator[]);

    return {
        title,
        description,
        validators: mappedValidators.sort((a: Validator, b: Validator) => {
            if (!a.optional && b.optional) {
                return -1;
            }

            if (a.optional && !b.optional) {
                return 1;
            }

            return 0;
        })
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
