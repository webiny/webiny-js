import { CmsModelField } from "~/applications/headlessCms/graphql/types";
import lodashCamelCase from "lodash/camelCase";
import shortid from "shortid";

export type Params = Partial<CmsModelField>;

export interface BuildParams extends Omit<Params, "type"> {
    label: string;
}

export class ModelFieldBuilder<T extends Params = Params> {
    private readonly params: T;

    public constructor(params: T) {
        this.params = params;
    }

    public build(params: BuildParams): CmsModelField {
        return {
            id: this.getId(params),
            fieldId: this.getFieldId(params),
            type: this.params.type,
            multipleValues: this.getMultipleValues(params),
            label: this.getLabel(params),
            settings: this.getSettings(params),
            helpText: this.getHelpText(params),
            placeholderText: this.getPlaceholderText(params),
            validation: this.getValidation(params),
            listValidation: this.getListValidation(params),
            predefinedValues: this.getPredefinedValues(params),
            renderer: this.getRenderer(params)
        };
    }

    private getId(params: Params): string {
        return params.id || this.params.id || shortid();
    }

    private getFieldId(params: Params): string {
        return lodashCamelCase(
            params.id || params.label || this.params.fieldId || this.params.label
        );
    }

    private getMultipleValues(params: Params): boolean {
        if (params.multipleValues !== undefined) {
            return params.multipleValues;
        }
        return this.params.multipleValues === true;
    }

    private getLabel(params: Params): string {
        return params.label || this.params.label;
    }

    private getSettings(params: Params): CmsModelField["settings"] {
        if (params.settings) {
            return params.settings;
        }
        return this.params.settings;
    }

    private getHelpText(params: Params): string {
        if (params.helpText) {
            return params.helpText;
        }
        return this.params.helpText || `Help text "${this.getLabel(params)}"`;
    }

    private getPlaceholderText(params: Params): string {
        if (params.placeholderText) {
            return params.placeholderText;
        }
        return this.params.placeholderText || `Placeholder text "${this.getLabel(params)}"`;
    }

    private getValidation(params: Params): CmsModelField["validation"] {
        if (params.validation) {
            return params.validation;
        }
        return this.params.validation || [];
    }

    private getListValidation(params: Params): CmsModelField["listValidation"] {
        if (params.listValidation) {
            return params.listValidation;
        }
        return this.params.listValidation || [];
    }

    private getPredefinedValues(params: Params): CmsModelField["predefinedValues"] {
        if (params.predefinedValues) {
            return params.predefinedValues;
        } else if (this.params.predefinedValues) {
            return this.params.predefinedValues;
        }
        return {
            enabled: false,
            values: []
        };
    }

    /**
     * Generates field renderer name if one is not set.
     */
    private getRenderer(params: Params): CmsModelField["renderer"] {
        if (params.renderer) {
            return params.renderer;
        } else if (this.params.renderer) {
            return this.params.renderer;
        }
        const multipleValues = this.getMultipleValues(params);
        return {
            name: `${this.params.type}-${multipleValues ? "inputs" : "input"}`
        };
    }
}
