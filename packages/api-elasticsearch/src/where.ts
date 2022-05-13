import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchFieldPlugin } from "~/plugins/definition/ElasticsearchFieldPlugin";
import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import WebinyError from "@webiny/error";

type Records<T> = Record<string, T>;

export interface ApplyWhereParams {
    query: ElasticsearchBoolQueryConfig;
    where: Records<any>;
    fields: Records<ElasticsearchFieldPlugin>;
    operators: Records<ElasticsearchQueryBuilderOperatorPlugin>;
}

export interface ParseWhereKeyResult {
    field: string;
    operator: string;
}

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

export const parseWhereKey = (key: string): ParseWhereKeyResult => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;

    if (!field.match(/^([a-zA-Z]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    const operator = operation.match(/^_/) ? operation.slice(1) : operation;

    return { field, operator };
};

const ALL = ElasticsearchFieldPlugin.ALL;

export const applyWhere = (params: ApplyWhereParams): void => {
    const { query, where, fields, operators } = params;

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const initialValue = where[key];
        /**
         * There is a possibility that undefined is sent as a value, so just skip it.
         */
        if (initialValue === undefined) {
            continue;
        }
        const { field, operator } = parseWhereKey(key);
        const fieldPlugin: ElasticsearchFieldPlugin = fields[field] || fields[ALL];
        if (!fieldPlugin) {
            throw new WebinyError(
                `Missing plugin for the field "${field}".`,
                "PLUGIN_WHERE_ERROR",
                {
                    field
                }
            );
        }
        const operatorPlugin = operators[operator];
        if (!operatorPlugin) {
            throw new WebinyError(
                `Missing plugin for the operator "${operator}"`,
                "PLUGIN_WHERE_ERROR",
                {
                    operator
                }
            );
        }

        /**
         * Get the path but in the case of * (all fields, replace * with the field.
         * Custom path would return its own value anyways.
         */
        const path = fieldPlugin.getPath(field);
        const basePath = fieldPlugin.getBasePath(field);
        /**
         * Transform the value for the search.
         */
        const value = fieldPlugin.toSearchValue({
            value: initialValue,
            path,
            basePath
        });

        operatorPlugin.apply(query, {
            value,
            path,
            basePath,
            keyword: fieldPlugin.keyword
        });
    }
};
