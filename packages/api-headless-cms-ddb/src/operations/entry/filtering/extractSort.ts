import WebinyError from "@webiny/error";
import type { Field } from "./types.js";
import type { PluginsContainer } from "@webiny/plugins";
import { CmsEntryFieldSortingPlugin } from "~/plugins/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

const extractSortInfo = (sortBy: string) => {
    
    const rootSorting = sortBy.match(/^([a-zA-Z]+)_(ASC|DESC)$/);
    if (rootSorting) {
        return {
            fieldId: rootSorting[1],
            isValues: false,
            order: rootSorting[2] as "ASC" | "DESC"
        }
    }
    const valuesSorting = sortBy.match(/^values_([a-zA-Z0-9]+)_(ASC|DESC)$/);
    if (valuesSorting) {
        return {
            fieldId: valuesSorting[1],
            isValues: true,
            order: valuesSorting[2] as "ASC" | "DESC"
        }
    }
    throw new WebinyError(
        "Problem in determining the sorting for the entry items.",
        "SORT_EXTRACT_ERROR",
        {
            sortBy
        }
    );
    
    
    
};

interface IResponse {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

interface IParams {
    model: CmsModel;
    sortBy: string;
    fields: Record<string, Field>;
    plugins: PluginsContainer;
}

export const extractSort = (params: IParams): IResponse => {
    const { model, sortBy, fields, plugins } = params;
    const { fieldId, isValues: isValuesSorting, order } = extractSortInfo(sortBy);

    const field = Object.values(fields).find(f => {
        /**
         * We do not support sorting by nested fields.
         */
        const isValues = f.parents[0]?.fieldId === "values";
        if (isValues && isValuesSorting) {
            return f.fieldId === fieldId;
        }
        if (f.parents.length > 0) {
            return false;
        }
        return f.fieldId === fieldId;
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
