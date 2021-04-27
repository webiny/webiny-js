import { CmsContext } from "@webiny/api-headless-cms/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import WebinyError from "@webiny/error";

export const getDocumentClient = (context: CmsContext): DocumentClient => {
    const driver = context.db.driver as any;
    if (!driver || !driver.documentClient) {
        throw new WebinyError(
            `Missing documentDriver on the context db.driver property.`,
            "DOCUMENT_CLIENT_ERROR"
        );
    }
    return driver.documentClient;
};

export const getTable = (context: CmsContext): string => {
    const db = context.db as any;
    if (!db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!db.table) {
        throw new WebinyError("Missing table on context.db.", "TABLE_ERROR");
    }
    return db.table;
};

const whereKeySuffix = [
    "_not",
    "_not_in",
    "_in",
    "_gt",
    "_gte",
    "_lt",
    "_lte",
    "_not_between",
    "_between"
].join("|");

const removeWhereKeySuffix = (key: string): string => {
    return key.replace(new RegExp(`${whereKeySuffix}$`), "");
};

const compare = (key: string, compareValue: any, value: any): boolean => {
    if (key.endsWith("_not")) {
        return String(value) !== compareValue;
    } else if (key.endsWith("_not_in")) {
        return !compareValue.includes(value);
    } else if (key.endsWith("_in")) {
        return compareValue.includes(value);
    } else if (key.endsWith("_gt")) {
        return value > compareValue;
    } else if (key.endsWith("_gte")) {
        return value >= compareValue;
    } else if (key.endsWith("_lt")) {
        return value < compareValue;
    } else if (key.endsWith("_lte")) {
        return value <= compareValue;
    } else if (key.endsWith("_not_between")) {
        if (!Array.isArray(compareValue) || compareValue.length === 0) {
            throw new WebinyError(`Wrong compareValue for "${key}".`);
        }
        return value < compareValue[0] && value > compareValue[1];
    } else if (key.endsWith("_between")) {
        if (!Array.isArray(compareValue) || compareValue.length === 0) {
            throw new WebinyError(`Wrong compareValue for "${key}".`);
        }
        return value >= compareValue[0] && value <= compareValue[1];
    }
    return compareValue === value;
};

export const whereFilterFactory = (where: Record<string, any> = {}) => {
    return model => {
        if (!where) {
            return true;
        }
        for (const key in where) {
            if (where.hasOwnProperty(key) === false) {
                continue;
            }
            const whereValue = where[key];
            const value = model[removeWhereKeySuffix(key)];
            return compare(key, whereValue, value);
        }
        return true;
    };
};
