import camelCase from "lodash/camelCase.js";
import type {
    CmsModelField,
    CmsModelFieldPredefinedValues,
    CmsModelFieldValidation
} from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import { BaseFieldBuilder, type DataFieldBuildResult } from "./BaseFieldBuilder.js";

export interface FieldBuilderConfig
    extends Omit<CmsModelField, "id" | "fieldId" | "storageId" | "type"> {
    _storageId?: string;
    _fieldId?: string;
    description?: string | null;
    note?: string | null;
}

/**
 * Augmentable renderer registry.
 * Each entry maps a renderer name to its applicable field type(s) and settings.
 *
 * Example:
 *   declare module "@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder" {
 *       interface FieldRendererRegistry {
 *           "my-renderer": { fieldType: "text" | "long-text"; settings: { color: string } };
 *       }
 *   }
 */
export interface FieldRendererRegistry {
    switch: {
        fieldType: "boolean";
        settings: undefined;
    };
    checkboxes: {
        fieldType: "text" | "number";
        settings: undefined;
    };
    dateTimeInput: {
        fieldType: "datetime";
        settings: undefined;
    };
    dateTimeInputs: {
        fieldType: "datetime";
        settings?: {
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    dynamicZone: {
        fieldType: "dynamicZone";
        settings?: {
            open?: boolean;
        };
    };
    hidden: {
        fieldType: string;
        settings: undefined;
    };
    lexicalEditor: {
        fieldType: "rich-text";
        settings: undefined;
    };
    lexicalEditors: {
        fieldType: "rich-text";
        settings?: {
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    textarea: {
        fieldType: "long-text";
        settings: undefined;
    };
    textareas: {
        fieldType: "long-text";
        settings: {
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    numberInput: {
        fieldType: "number";
        settings: undefined;
    };
    numberInputs: {
        fieldType: "number";
        settings?: {
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    objectAccordionSingle: {
        fieldType: "object";
        settings?: {
            open?: boolean;
        };
    };
    objectAccordionMultiple: {
        fieldType: "object";
        settings?: {
            open?: boolean;
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    passthrough: {
        fieldType: string;
        settings: undefined;
    };
    radioButtons: {
        fieldType: "text" | "number";
        settings: undefined;
    };
    refDialogSingle: {
        fieldType: "ref";
        settings: undefined;
    };
    refDialogMultiple: {
        fieldType: "ref";
        settings?: {
            newItemPosition?: "first" | "last";
        };
    };
    refAutocompleteSingle: {
        fieldType: "ref";
        settings: undefined;
    };
    refAutocompleteMultiple: {
        fieldType: "ref";
        settings: undefined;
    };
    refCheckboxes: {
        fieldType: "ref";
        settings: undefined;
    };
    refRadioButtons: {
        fieldType: "ref";
        settings: undefined;
    };
    dropdown: {
        fieldType: "text" | "number";
        settings: undefined;
    };
    tags: {
        fieldType: "text";
        settings: undefined;
    };
    textInput: {
        fieldType: "text";
        settings: undefined;
    };
    textInputs: {
        fieldType: "text";
        settings?: {
            multiValue?: {
                addValueButtonLabel?: string;
            };
        };
    };
    file: {
        fieldType: "file";
        settings?: {
            imagesOnly?: boolean;
        };
    };
    files: {
        fieldType: "file";
        settings?: {
            imagesOnly?: boolean;
        };
    };
    uiSeparator: {
        fieldType: "ui";
        settings: undefined;
    };
    uiAlert: {
        fieldType: "ui";
        settings: {
            type: "info" | "success" | "warning" | "danger";
        };
    };
    uiTabs: {
        fieldType: "ui";
        settings: undefined;
    };
}

/**
 * Maps camelCase renderer names (used in the builder API) to the
 * kebab-case names expected by the frontend renderer registry.
 */
const rendererNameMap: Record<keyof FieldRendererRegistry, string> = {
    switch: "boolean-input",
    checkboxes: "checkboxes",
    dateTimeInput: "date-time-input",
    dateTimeInputs: "date-time-inputs",
    dynamicZone: "dynamicZone",
    hidden: "hidden",
    lexicalEditor: "lexical-text-input",
    lexicalEditors: "lexical-text-inputs",
    textarea: "long-text-text-area",
    textareas: "long-text-inputs",
    numberInput: "number-input",
    numberInputs: "number-inputs",
    objectAccordionSingle: "object-accordion",
    objectAccordionMultiple: "objects-accordion",
    passthrough: "passthrough",
    radioButtons: "radio-buttons",
    refDialogSingle: "ref-advanced-single",
    refDialogMultiple: "ref-advanced-multiple",
    refAutocompleteSingle: "ref-input",
    refAutocompleteMultiple: "ref-inputs",
    refCheckboxes: "ref-simple-multiple",
    refRadioButtons: "ref-simple-single",
    dropdown: "select-box",
    tags: "tags",
    textInput: "text-input",
    textInputs: "text-inputs",
    file: "file-input",
    files: "file-inputs",
    uiSeparator: "uiSeparator",
    uiAlert: "uiAlert",
    uiTabs: "uiTabs"
};

/**
 * Resolves a camelCase renderer name to the kebab-case name used by the frontend.
 */
function resolveRendererName(name: string): string {
    return rendererNameMap[name as keyof FieldRendererRegistry] ?? name;
}

/**
 * Extracts renderer names valid for the given field type.
 * When TType is a broad `string`, all renderer names are returned.
 */
export type FieldRendererName<TType extends string = string> = string extends TType
    ? keyof FieldRendererRegistry & string
    : {
          [K in keyof FieldRendererRegistry]: TType extends FieldRendererRegistry[K]["fieldType"]
              ? K
              : never;
      }[keyof FieldRendererRegistry] &
          string;

export type FieldRendererSettings<TName extends string> = TName extends keyof FieldRendererRegistry
    ? FieldRendererRegistry[TName]["settings"]
    : Record<string, any> | undefined;

/**
 * DataFieldBuilder class for data fields that produce CmsModelField instances.
 * Provides storageId, list, validation, renderer, and other data-field methods.
 */
export class DataFieldBuilder<TType extends string = string> extends BaseFieldBuilder<TType> {
    protected override config: FieldBuilderConfig;

    public constructor(type: TType, label?: string) {
        super(type, label);
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

    placeholder(text: string): this {
        this.config.placeholder = text;
        return this;
    }

    storageId(id: string): this {
        // We do not allow developers to specify the field type!
        this.config._storageId = id.split("@").pop();
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

    renderer<TName extends FieldRendererName<TType>>(
        name: TName,
        ...args: undefined extends FieldRendererSettings<TName>
            ? [settings?: FieldRendererSettings<TName>]
            : FieldRendererSettings<TName> extends undefined
              ? []
              : [settings: FieldRendererSettings<TName>]
    ): this {
        this.config.renderer = {
            name: resolveRendererName(name),
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
    build(): DataFieldBuildResult {
        const fieldId = this.config._fieldId || camelCase(this.config.label);
        const baseType = getBaseFieldType({
            type: this.type
        });
        const storageId = `${baseType}@${this.config._storageId ?? fieldId}`;

        return {
            type: "data",
            field: {
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
            }
        };
    }
}
