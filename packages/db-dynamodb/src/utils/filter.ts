import dotProp from "dot-prop";
import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";
import { ValueTransformPlugin } from "~/plugins/ValueTransformPlugin";
import { FieldPathPlugin } from "~/plugins/FieldPathPlugin";
import { ContextInterface } from "@webiny/handler/types";

export interface Params<T extends any = any> {
    items: T[];
    where: Record<string, any>;
    context: ContextInterface;
}

interface MappedPluginParams {
    context: ContextInterface;
    type: string;
    property: string;
}

interface Filter {
    compareValue: any;
    filterPlugin: ValueFilterPlugin;
    transformValuePlugin: ValueTransformPlugin;
    path: string;
    negate: boolean;
}

const getMappedPlugins = <T extends Plugin>(params: MappedPluginParams): Record<string, T> => {
    return params.context.plugins.byType<T>(params.type).reduce((plugins, plugin) => {
        const op = plugin[params.property];
        plugins[op] = plugin;
        return plugins;
    }, {});
};

const extractWhereArgs = (key: string) => {
    const result = key.split("_");
    const field = result.shift();
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
    return { field, operation, negate };
};

const createFilters = (params: Omit<Params, "items">): Filter[] => {
    const { context, where } = params;
    const filterPlugins = getMappedPlugins<ValueFilterPlugin>({
        context,
        type: ValueFilterPlugin.type,
        property: "operation"
    });
    const fieldPathPlugins = context.plugins.byType<FieldPathPlugin>(FieldPathPlugin.type);
    const transformValuePlugins = context.plugins.byType<ValueTransformPlugin>(
        ValueTransformPlugin.type
    );

    return Object.keys(where)
        .map(key => {
            const { field, operation, negate } = extractWhereArgs(key);
            const value = where[key];
            if (value === undefined) {
                return null;
            }

            const filterPlugin = filterPlugins[operation];
            if (!filterPlugin) {
                throw new WebinyError(`Missing filter plugin definition.`, "FILTER_PLUGIN_ERROR", {
                    operation
                });
            }
            const transformValuePlugin = transformValuePlugins.find(plugin =>
                plugin.canTransform(field)
            );
            const fieldPathPlugin = fieldPathPlugins.find(plugin => plugin.canCreate(field));

            return {
                field,
                compareValue: value,
                filterPlugin,
                transformValuePlugin,
                path: fieldPathPlugin ? fieldPathPlugin.createPath(field) : field,
                negate
            };
        })
        .filter(Boolean);
};
/**
 * Transforms the value with given transformer callable.
 */
const transform = (value: any, transformValuePlugin?: ValueTransformPlugin): any => {
    if (!transformValuePlugin) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(v => transformValuePlugin.transform(v));
    }
    return transformValuePlugin.transform(value);
};
/**
 * Creates a filter callable that we can send to the .filter() method of the array.
 */
const createFilterCallable = ({ where, context }) => {
    const filters = createFilters({
        where,
        context
    });

    return (item: any) => {
        for (const filter of filters) {
            const value = transform(dotProp.get(item, filter.path), filter.transformValuePlugin);
            const compareValue = transform(filter.compareValue, filter.transformValuePlugin);
            const matched = filter.filterPlugin.matches({
                value,
                compareValue
            });
            if ((filter.negate ? !matched : matched) === false) {
                return false;
            }
        }
        return true;
    };
};

export const filterItems = <T extends any = any>(params: Params<T>): T[] => {
    const { items, where, context } = params;
    const filter = createFilterCallable({
        where,
        context
    });
    return items.filter(filter);
};
