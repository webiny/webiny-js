import { Plugin } from "@webiny/plugins/types";

export interface CmsFieldValueFilterArgs<I, V> {
    /**
     * Value to compare.
     */
    fieldValue: I;
    /**
     * Value to compare to.
     */
    compareValue: V;
}

export interface CmsFieldValueFilterPlugin<I, V = I> extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-field-value-filter";
    /**
     * Operations type.
     */
    operation: string;
    /**
     * A matcher method.
     */
    matches: (args: CmsFieldValueFilterArgs<I, V>) => boolean;
}
