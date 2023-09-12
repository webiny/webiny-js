import { CmsModelField } from "@webiny/app-headless-cms-common/types";

/**
 * Represents field configuration.
 */
export type Field = Pick<
    CmsModelField,
    "id" | "type" | "label" | "multipleValues" | "predefinedValues" | "settings"
>;

/**
 * Represents possible operations for combining filters.
 */
export enum FilterOperation {
    AND = "AND",
    OR = "OR"
}

/**
 * Represents possible values for filters.
 */
export type FilterValue = string | number | boolean | undefined;

/**
 * Represents a filter configuration.
 */
export interface IFilter {
    /**
     * Field to which the filter applies.
     */
    field?: string;
    /**
     * Condition for the filter.
     */
    condition?: string;
    /**
     * Value to compare against.
     */
    value?: FilterValue;
    /**
     * Operation to combine filters.
     */
    operation?: FilterOperation;
}
