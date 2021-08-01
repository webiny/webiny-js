import { Plugin } from "@webiny/plugins/types";
import { CmsContentModelField } from "@webiny/api-headless-cms/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CmsFieldFilterValueTransformArgs<T> {
    /**
     * A field which value we are transforming.
     */
    field: CmsContentModelField;
    value: any;
    // /**
    //  * Full field value path `variant.product.name`.
    //  */
    // fieldPath: string;
    // /**
    //  * Get value to transform.
    //  */
    // getValue(fieldPath: string): T;
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
