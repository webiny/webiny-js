import * as dotProp from "dot-prop";
import { WebinyError } from "@webiny/error";
import type { FieldPlugin } from "~/plugins/definitions/FieldPlugin.js";
import type { DynamoDbContainsFilter } from "~/types.js";
import type { ValueFilter, ValueFilterRegistry } from "~/features/ValueFilter/index.js";
import { extractWhereArgs } from "./extractWhereArgs.js";

type TransformValue = (value: any) => any;

interface Filter {
    operation: string;
    compareValue: any;
    filter: ValueFilter.Interface;
    transformValue?: TransformValue;
    paths: string[];
    negate: boolean;
}

interface CreateFiltersParams {
    filterRegistry: ValueFilterRegistry.Interface;
    where: Record<string, any>;
    fields: FieldPlugin[];
}

const findFilter = (
    registry: ValueFilterRegistry.Interface,
    operation: string
): ValueFilter.Interface => {
    const filter = registry.get(operation);
    if (filter) {
        return filter;
    }
    throw new WebinyError(`Missing filter plugin definition.`, "FILTER_PLUGIN_ERROR", {
        operation
    });
};

const multiSearchFieldOperations = ["contains", "fuzzy"];

export const createFilters = (params: CreateFiltersParams): Filter[] => {
    const { where, fields, filterRegistry } = params;

    const keys = Object.keys(where);
    /**
     * Skip everything if there are no conditions to be applied.
     */
    if (keys.length === 0) {
        return [];
    }

    return keys.reduce((filters, key) => {
        const compareValue = where[key];
        if (compareValue === undefined) {
            return filters;
        }
        /**
         * @see DynamoDbContainsFilter
         */
        if (multiSearchFieldOperations.includes(key) === true) {
            const data: DynamoDbContainsFilter = compareValue;
            let transformValue: TransformValue | undefined = undefined;
            const paths = data.fields.map(field => {
                const fieldPlugin = fields.find(plugin => plugin.getField() === field);
                if (fieldPlugin) {
                    transformValue = (value: any) => {
                        return fieldPlugin.transformValue(value);
                    };
                    return fieldPlugin.getPath();
                }
                return field;
            });

            const filter = findFilter(filterRegistry, key);
            filters.push({
                operation: filter.operation,
                compareValue: data.value,
                filter,
                transformValue,
                paths,
                negate: false
            });
            return filters;
        }

        const { field, operation, negate } = extractWhereArgs(key);

        const filter = findFilter(filterRegistry, operation);

        const fieldPlugin = fields.find(plugin => plugin.getField() === field);
        let path: string = field;
        let transformValue: TransformValue | undefined = undefined;
        if (fieldPlugin) {
            transformValue = (value: any) => {
                return fieldPlugin.transformValue(value);
            };
            path = fieldPlugin.getPath();
        }

        filters.push({
            operation: filter.operation,
            compareValue,
            filter,
            transformValue,
            paths: [path],
            negate
        });

        return filters;
    }, [] as Filter[]);
};

/**
 * Transforms the value with given transformer callable.
 */
const transform = (value: any, transformValue?: TransformValue): any => {
    if (!transformValue) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(v => transformValue(v));
    }
    return transformValue(value);
};

/**
 * Creates a filter callable that we can send to the .filter() method of the array.
 */
export const createFilterCallable = (
    params: CreateFiltersParams
): ((item: any) => boolean) | null => {
    const filters = createFilters(params);
    /**
     * Just return null so there are no filters to be applied.
     * Later in the code we check for null so we do not loop through the items.
     */
    if (filters.length === 0) {
        return null;
    }

    return (item: any) => {
        for (const filter of filters) {
            const result = filter.paths.some(path => {
                const value = transform(dotProp.getProperty(item, path), filter.transformValue);
                const compareValue = transform(filter.compareValue, filter.transformValue);
                const matched = filter.filter.matches({
                    value,
                    compareValue
                });

                return filter.negate ? !matched : matched;
            });
            if (result === false) {
                return false;
            }
        }
        return true;
    };
};
