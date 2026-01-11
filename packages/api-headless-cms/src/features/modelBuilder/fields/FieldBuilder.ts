import camelCase from "lodash/camelCase.js";
import type {
    CmsModelField,
    CmsModelFieldValidation,
    CmsModelFieldPredefinedValues
} from "~/types/index.js";

export interface FieldBuilderConfig
    extends Omit<CmsModelField, "id" | "fieldId" | "storageId" | "type"> {
    _storageId?: string;
    _fieldId?: string;
}

/**
 * Base FieldBuilder class providing common field configuration methods
 */
export class FieldBuilder<TType extends string = string> {
    protected config: FieldBuilderConfig;

    constructor(
        protected readonly type: TType,
        label?: string
    ) {
        this.config = {
            label: label || "",
            validation: [],
            listValidation: [],
            multipleValues: false,
            predefinedValues: {
                enabled: false,
                values: []
            },
            helpText: null,
            placeholderText: null,
            renderer: null,
            settings: {},
            tags: []
        };
    }

    label(text: string): this {
        this.config.label = text;
        return this;
    }

    helpText(text: string): this {
        this.config.helpText = text;
        return this;
    }

    placeholder(text: string): this {
        this.config.placeholderText = text;
        return this;
    }

    storageId(id: string): this {
        this.config._storageId = id;
        return this;
    }

    fieldId(id: string): this {
        this.config._fieldId = id;
        return this;
    }

    multipleValues(enabled: boolean = true): this {
        this.config.multipleValues = enabled;
        return this;
    }

    tags(tags: string[]): this {
        this.config.tags = tags;
        return this;
    }

    /**
     * Add a validation rule to this field.
     * This method is protected and should only be used by field-specific validator methods.
     * @internal
     */
    protected validation(validation: CmsModelFieldValidation): this {
        this.config.validation = this.config.validation || [];
        this.config.validation.push(validation);
        return this;
    }

    /**
     * Add a list validation rule to this field (for multipleValues fields).
     * This method is protected and should only be used by field-specific validator methods.
     * @internal
     */
    protected listValidation(validation: CmsModelFieldValidation): this {
        this.config.listValidation = this.config.listValidation || [];
        this.config.listValidation.push(validation);
        return this;
    }

    predefinedValues(values: CmsModelFieldPredefinedValues["values"]): this {
        this.config.predefinedValues = {
            enabled: true,
            values
        };
        return this;
    }

    renderer(name: string, settings?: Record<string, any>): this {
        this.config.renderer = {
            name,
            settings: settings || null
        };
        return this;
    }

    settings(settings: Record<string, any>): this {
        this.config.settings = { ...this.config.settings, ...settings };
        return this;
    }

    /**
     * Build the final CmsModelField
     * @internal
     */
    build(): CmsModelField {
        const fieldId = this.config._fieldId || camelCase(this.config.label);
        const storageId = this.config._storageId || `${this.type}@${fieldId}`;

        return {
            id: fieldId,
            fieldId,
            storageId,
            type: this.type,
            label: this.config.label,
            validation: this.config.validation || [],
            listValidation: this.config.listValidation || [],
            multipleValues: this.config.multipleValues || false,
            predefinedValues: this.config.predefinedValues || {
                enabled: false,
                values: []
            },
            helpText: this.config.helpText || null,
            placeholderText: this.config.placeholderText || null,
            renderer: this.config.renderer || null,
            settings: this.config.settings || {},
            tags: this.config.tags || []
        };
    }
}
