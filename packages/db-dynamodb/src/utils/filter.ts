import dotProp from "dot-prop";
import WebinyError from "@webiny/error";
import { Plugin, PluginsContainer } from "@webiny/plugins";
import { ValueFilterPlugin } from "~/plugins/definitions/ValueFilterPlugin";
import { FieldPlugin } from "~/plugins/definitions/FieldPlugin";
import { DynamoDbContainsFilter } from "~/types";

type TransformValue = (value: any) => any;

export interface Params<T = any> {
    plugins: PluginsContainer;
    items: T[];
    where: Record<string, any>;
    /**
     * An array of fields that require some special operation.
     */
    fields: FieldPlugin[];
}

interface MappedPluginParams<T extends Plugin = Plugin> {
    plugins: PluginsContainer;
    type: string;
    property: keyof T;
}

interface Filter {
    operation: string;
    compareValue: any;
    filterPlugin: ValueFilterPlugin;
    transformValue?: TransformValue;
    paths: string[];
    negate: boolean;
}

const getMappedPlugins = <T extends Plugin>(params: MappedPluginParams<T>): Record<string, T> => {
    return params.plugins.byType<T>(params.type).reduce((plugins, plugin) => {
        /**
         * We expect op to be a string, that is why we cast.
         */
        const op = plugin[params.property] as unknown as string;
        plugins[op] = plugin;
        return plugins;
    }, {} as Record<string, T>);
};

interface ExtractWhereArgsResult {
    field: string;
    operation: string;
    negate: boolean;
}
const extractWhereArgs = (key: string): ExtractWhereArgsResult => {
    const result = key.split("_");
    const field = result.shift() as string;
    const rawOp = result.length === 0 ? "eq" : result.join("_");
    /**
     * When rawOp is not, it means it is equal negated so just return that.
     */
    if (rawOp === "not") {
        return {
            field,
            operation: "eq",
            negate: true
        };
    }
    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return {
        field,
        operation,
        negate
    };
};

const findFilterPlugin = (
    plugins: Record<string, ValueFilterPlugin>,
    operation: string
): ValueFilterPlugin => {
    if (plugins[operation]) {
        return plugins[operation];
    }
    throw new WebinyError(`Missing filter plugin definition.`, "FILTER_PLUGIN_ERROR", {
        operation
    });
};

const multiSearchFieldOperations = ["contains", "fuzzy"];

const createFilters = (params: Omit<Params, "items">): Filter[] => {
    const { plugins, where, fields } = params;

    const keys = Object.keys(where);
    /**
     * Skip everything if there are no conditions to be applied.
     */
    if (keys.length === 0) {
        return [];
    }
    const filterPlugins = getMappedPlugins<ValueFilterPlugin>({
        plugins,
        type: ValueFilterPlugin.type,
        property: "operation"
    });

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

            const filterPlugin = findFilterPlugin(filterPlugins, key);
            filters.push({
                operation: filterPlugin.operation,
                compareValue: data.value,
                filterPlugin,
                transformValue,
                paths,
                negate: false
            });
            return filters;
        }

        const { field, operation, negate } = extractWhereArgs(key);

        const filterPlugin = findFilterPlugin(filterPlugins, operation);

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
            operation: filterPlugin.operation,
            compareValue,
            filterPlugin,
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
const createFilterCallable = (params: Omit<Params, "items">): ((item: any) => boolean) | null => {
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
                const value = transform(dotProp.get(item, path), filter.transformValue);
                const compareValue = transform(filter.compareValue, filter.transformValue);
                const matched = filter.filterPlugin.matches({
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

export function filterItems<T = any>(params: Params<T>): T[] {
    const filter = createFilterCallable(params);
    /**
     * No point in going through all the items when there are no filters to be applied.
     */
    if (!filter) {
        return params.items;
    }
    return params.items.filter(filter);
}
