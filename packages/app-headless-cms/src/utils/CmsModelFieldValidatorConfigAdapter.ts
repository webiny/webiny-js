import { plugins } from "@webiny/plugins";
import {
    CmsModelField,
    CmsModelFieldValidatorConfig,
    CmsModelFieldValidatorConfigAdapter as ICmsModelFieldValidatorConfigAdapter,
    CmsModelFieldValidatorPlugin
} from "~/types";

function getValidator(name: string) {
    const allValidators = plugins.byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator");
    const plugin = allValidators.find(v => v.validator.name === name);
    if (!plugin) {
        throw Error(`Missing "${name}" validator plugin!`);
    }
    return plugin.validator;
}

export class CmsModelFieldValidatorConfigAdapter implements ICmsModelFieldValidatorConfigAdapter {
    private field: CmsModelField;
    private validator: CmsModelFieldValidatorConfig;
    private plugin: CmsModelFieldValidatorPlugin["validator"];

    constructor(field: CmsModelField, validator: CmsModelFieldValidatorConfig) {
        this.field = field;
        this.validator = validator;
        this.plugin = getValidator(validator.name);
    }

    isRequired() {
        return Boolean(this.validator.required);
    }

    getName() {
        return this.validator.name;
    }

    getLabel() {
        return this.validator.label || this.plugin.label;
    }

    getDescription() {
        return this.validator.description || this.plugin.description;
    }

    getDefaultMessage() {
        return this.validator.defaultMessage || this.plugin.defaultMessage;
    }

    getDefaultSettings() {
        return this.validator.defaultSettings || this.plugin.defaultSettings;
    }

    getVariables() {
        return this.validator.variables || [];
    }

    getVariableDescription(variableName: string): string | undefined {
        const variables = this.validator.variables || this.plugin.variables || [];
        const variable = variables.find(v => v.name === variableName);

        return variable?.description || "";
    }
}
