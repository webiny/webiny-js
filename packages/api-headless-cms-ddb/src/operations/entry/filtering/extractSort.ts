import WebinyError from "@webiny/error";
import { Field } from "./types";

interface Result {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

interface Params {
    sortBy: string;
    fields: Record<string, Field>;
}

export const extractSort = (params: Params): Result => {
    const { sortBy, fields } = params;
    const result = sortBy.split("_");
    if (result.length !== 2) {
        throw new WebinyError(
            "Problem in determining the sorting for the entry items.",
            "SORT_EXTRACT_ERROR",
            {
                sortBy
            }
        );
    }
    const [fieldId, order] = result;

    const field = Object.values(fields).find(field => {
        return field.fieldId === fieldId;
    });

    if (!field) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                fieldId,
                fields
            }
        );
    }
    const valuePath = field.createPath({
        field
    });
    return {
        field,
        fieldId,
        valuePath,
        reverse: order === "DESC"
    };
};
