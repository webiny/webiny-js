import type { OpenSearchBoolQueryConfig } from "~/types.js";
import {
    OpenSearchField,
    OpenSearchFieldAll
} from "~/features/OpenSearchField/abstractions/OpenSearchField.js";
import type { OpenSearchQueryBuilderOperator } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.js";
import WebinyError from "@webiny/error";

type Records<T> = Record<string, T>;

export interface ApplyWhereParams {
    query: OpenSearchBoolQueryConfig;
    where: Records<any>;
    fields: Records<OpenSearchField.Interface>;
    operators: Records<OpenSearchQueryBuilderOperator.Interface>;
}

export interface ParseWhereKeyResult {
    field: string;
    operator: string;
}

const parseWhereKeyRegExp = new RegExp(/^((?:wbyAco_)?[a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

export const parseWhereKey = (key: string): ParseWhereKeyResult => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;

    if (!field.match(/^(?:wbyAco_)?([a-zA-Z0-9]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    const operator = operation.match(/^_/) ? operation.slice(1) : operation;

    return { field, operator };
};

const ALL = OpenSearchFieldAll;

export const applyWhere = (params: ApplyWhereParams): void => {
    const { query, where, fields, operators } = params;

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const initialValue = where[key];
        if (initialValue === undefined) {
            continue;
        }
        const { field, operator } = parseWhereKey(key);
        const fieldPlugin: OpenSearchField.Interface = fields[field] || fields[ALL];
        if (!fieldPlugin) {
            throw new WebinyError(
                `Missing plugin for the field "${field}".`,
                "PLUGIN_WHERE_ERROR",
                {
                    field
                }
            );
        }
        const operatorInstance = operators[operator];
        if (!operatorInstance) {
            throw new WebinyError(
                `Missing plugin for the operator "${operator}"`,
                "PLUGIN_WHERE_ERROR",
                {
                    operator
                }
            );
        }

        const path = fieldPlugin.getPath(field);
        const basePath = fieldPlugin.getBasePath(field);
        const value = fieldPlugin.toSearchValue({
            value: initialValue,
            path,
            basePath
        });

        operatorInstance.apply(query, {
            name: field,
            value,
            path,
            basePath,
            keyword: fieldPlugin.keyword
        });
    }
};
