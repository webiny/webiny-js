import { Plugin } from "@webiny/plugins/types";
import { CmsContentModelField } from "@webiny/api-headless-cms/types";

interface CmsFieldFilterValueTransformArgs<T> {
    /**
     * A field which value we are transforming.
     */
    field: CmsContentModelField;
    /**
     * Value that we are transforming.
     */
    value: T;
}

export interface CmsFieldFilterValueTransformPlugin<T = any, R = any> extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-filter-value-transform";
    /**
     * A field type this plugin is for.
     */
    fieldType: string;
    /**
     * Transform method which expect field definition and value to transform.
     */
    transform: (args: CmsFieldFilterValueTransformArgs<T>) => R;
}

interface CmsFieldFilterPathArgs {
    /**
     * A field for which we are creating the value path.
     */
    field: CmsContentModelField;
    /**
     * If value is an array we will need index position.
     * It is up to the developer to add.
     */
    index?: number | string;
}
export interface CmsFieldFilterPathPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-filter-path";
    /**
     * A field type this plugin is for.
     */
    fieldType: string;
    /**
     * A field id this plugin is for.
     * It is meant for targeting only specific fields in a certain type.
     */
    fieldId?: string[];
    /**
     * Get a path for given field.
     */
    createPath: (args: CmsFieldFilterPathArgs) => string;
}
