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
    description?: string | null;
    note?: string | null;
}

/**
 * Augmentable renderer registry.
 * Augment this interface to register renderer names and their settings.
 *
 * Example:
 *   declare module "@webiny/api-headless-cms/types" {
 *       interface FieldRendererRegistry {
 *           "my-renderer": { color: string };
 *       }
 *   }
 */
export interface FieldRendererRegistry {}

export type FieldRendererName = keyof FieldRendererRegistry extends never
    ? string
    : keyof FieldRendererRegistry & string;

export type FieldRendererSettings<TName extends FieldRendererName> =
    keyof FieldRendererRegistry extends never
        ? Record<string, any> | undefined
        : TName extends keyof FieldRendererRegistry
          ? FieldRendererRegistry[TName] | undefined
          : Record<string, any> | undefined;

/**
 * Base FieldBuilder class providing common field configuration methods
 */
export class FieldBuilder<TType extends string = string> {
    public readonly type: TType;
    protected config: FieldBuilderConfig;

    public constructor(type: TType, label?: string) {
        this.type = type;
        this.config = {
            label: label || "",
            validation: [],
            listValidation: [],
            list: false,
            predefinedValues: {
                enabled: false,
                values: []
            },
            help: null,
            placeholder: null,
            description: null,
            note: null,
            renderer: null,
            settings: {},
            tags: []
        };
    }

    label(text: string): this {
        this.config.label = text;
        return this;
    }

    help(text: string): this {
        this.config.help = text;
        return this;
    }

    description(text: string): this {
        this.config.description = text;
        return this;
    }

    note(text: string): this {
        this.config.note = text;
        return this;
    }

    placeholder(text: string): this {
        this.config.placeholder = text;
        return this;
    }

    storageId(id: string): this {
        // We do not allow developers to specify the field type!
        this.config._storageId = id.split("@").pop();
        return this;
    }

    fieldId(id: string): this {
        this.config._fieldId = id;
        return this;
    }

    defaultValue(value: any): this {
        this.config.settings = { ...this.config.settings, defaultValue: value };
        return this;
    }

    list(): this {
        this.config.list = true;
        return this as this;
    }

    tags(tags: string[]): this {
        this.config.tags = tags;
        return this;
    }

    /**
     * List validators - these methods are available after calling list()
     */
    listMinLength(value: number, message?: string): this {
        return this.listValidation({
            name: "minLength",
            message: message || `At least ${value} item(s) required.`,
            settings: { value }
        });
    }

    listMaxLength(value: number, message?: string): this {
        return this.listValidation({
            name: "maxLength",
            message: message || `At most ${value} item(s) allowed.`,
            settings: { value }
        });
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
     * Add a list validation rule to this field (for list fields).
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

    renderer<TName extends FieldRendererName>(
        name: TName,
        ...args: FieldRendererSettings<TName> extends undefined
            ? [settings?: Record<string, any>]
            : [settings: FieldRendererSettings<TName>]
    ): this {
        this.config.renderer = {
            name,
            settings: args[0] ?? null
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
        const storageId = `${this.type}@${this.config._storageId ?? fieldId}`;

        return {
            id: fieldId,
            fieldId,
            storageId,
            type: this.type,
            label: this.config.label,
            validation: this.config.validation || [],
            listValidation: this.config.listValidation || [],
            list: this.config.list || false,
            predefinedValues: this.config.predefinedValues || {
                enabled: false,
                values: []
            },
            help: this.config.help || null,
            placeholder: this.config.placeholder || null,
            description: this.config.description || null,
            note: this.config.note || null,
            renderer: this.config.renderer || null,
            settings: this.config.settings || {},
            tags: this.config.tags || []
        };
    }
}
