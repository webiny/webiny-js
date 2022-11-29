import WebinyError from "@webiny/error";
import { ModelField } from "~/operations/entry/elasticsearch/types";

interface Params {
    key: string;
    value: any;
    field: ModelField;
}

/**
 * A list of typeof strings that are 100% not ref field filtering.
 * We also need to check for array and date.
 */
const nonRefFieldTypes: string[] = [
    "string",
    "number",
    "undefined",
    "symbol",
    "bigint",
    "function",
    "boolean"
];

export const isRefFieldFiltering = (params: Params): boolean => {
    const { key, value, field } = params;
    const typeOf = typeof value;
    if (
        !value ||
        nonRefFieldTypes.includes(typeOf) ||
        Array.isArray(value) ||
        value instanceof Date ||
        !!value.toISOString
    ) {
        return false;
    } else if (typeOf === "object" && field.field.type === "ref") {
        return true;
    }
    throw new WebinyError(
        "Could not determine if the search value is ref field search.",
        "REF_FIELD_SEARCH_ERROR",
        {
            value,
            field,
            key
        }
    );
};
