import type { CmsModelField, CmsModelLayoutCell } from "~/types/index.js";

export interface DataFieldBuildResult {
    type: "data";
    field: CmsModelField;
}

export interface LayoutFieldBuildResult {
    type: "layout";
    layoutCell: CmsModelLayoutCell;
    fields?: CmsModelField[];
}

export type FieldBuildResult = DataFieldBuildResult | LayoutFieldBuildResult;

export interface BaseFieldBuilderConfig {
    label: string;
    help?: string | null;
    description?: string | null;
    note?: string | null;
    _fieldId?: string;
}

/**
 * Minimal shared base class for all field builders (data and layout).
 */
export abstract class BaseFieldBuilder<TType extends string = string> {
    public readonly type: TType;
    protected config: BaseFieldBuilderConfig;

    public constructor(type: TType, label?: string) {
        this.type = type;
        this.config = {
            label: label || "",
            help: null,
            description: null,
            note: null
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

    fieldId(id: string): this {
        this.config._fieldId = id;
        return this;
    }

    /**
     * Build the final field result.
     * @internal
     */
    abstract build(): FieldBuildResult;
}
