import WebinyError from "@webiny/error";
import { Field } from "./types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryFieldSortingPlugin } from "~/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";

interface Result {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

interface Params {
    model: CmsModel;
    sortBy: string;
    fields: Record<string, Field>;
    plugins: PluginsContainer;
}

export const extractSort = (params: Params): Result => {
    const { model, sortBy, fields, plugins } = params;
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
    const [fieldId, order] = result as [string, "ASC" | "DESC"];

    const field = Object.values(fields).find(field => {
        /**
         * We do not support sorting by nested fields.
         */
        if (field.parents.length > 0) {
            return false;
        }
        return field.fieldId === fieldId;
    });

    const plugin = plugins
        .byType<CmsEntryFieldSortingPlugin>(CmsEntryFieldSortingPlugin.type)
        .reverse()
        .find(plugin => {
            return plugin.canUse({
                model,
                field,
                fieldId,
                order,
                sortBy
            });
        });

    if (plugin) {
        return plugin.createSort({
            model,
            fieldId,
            order,
            sortBy,
            field,
            fields
        });
    } else if (!field) {
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
