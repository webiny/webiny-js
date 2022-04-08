import WebinyError from "@webiny/error";
import { keyParser } from "./parsers/keyParser";
import { WhereParserResult } from "./types";

export enum Syntax {
    AND = "AND",
    OR = "OR"
}

const SYNTAX_KEYS = [Syntax.AND as string, Syntax.OR as string];

interface WhereParserArgs {
    attributes: string[];
    where: Record<string, any>;
}

const isSyntaxKey = (key: string): boolean => {
    return SYNTAX_KEYS.includes(key);
};

interface Value {
    attr?: string;
    operation?: string;
    value?: string | number | boolean;
    AND?: Value;
    OR?: Value;
}
// @ts-refactor
const extractValues = (target: any): Value[] => {
    if (
        typeof target === "object" &&
        target instanceof Date === false &&
        Array.isArray(target) === false
    ) {
        const values = [];
        for (const key in target) {
            if (!target.hasOwnProperty(key)) {
                continue;
            } else if (isSyntaxKey(key)) {
                values.push({
                    [key as Syntax]: extractValues(target[key])
                });
                continue;
            }
            const { attr, operation } = keyParser(key);
            values.push({
                attr,
                operation,
                value: target[key]
            });
        }
        return values;
    } else if (Array.isArray(target)) {
        const values = [];
        for (const obj of target) {
            for (const key in obj) {
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }
                if (isSyntaxKey(key)) {
                    values.push({
                        [key]: extractValues(obj[key])
                    });
                    continue;
                }
                const { attr, operation } = keyParser(key);
                values.push({
                    attr,
                    operation,
                    value: obj[key]
                });
            }
        }
        return values;
    }
    throw new WebinyError("Unsupported object syntax.", "UNSUPPORTED_OBJECT_SYNTAX", {
        target
    });
};

export function parseWhere<T = WhereParserResult>(args: WhereParserArgs): T {
    const { where } = args;
    const keys = Object.keys(where || {});
    if (keys.length === 0) {
        return {} as any;
    }
    /**
     * First level of the object MUST be a syntax key.
     * If there is none, we are adding it.
     * If there is a at least one syntax and some other keys, we put everything in the AND.
     */
    let result: any = undefined;
    const hasAndSyntaxKey = keys.includes(Syntax.AND);
    const hasOrSyntaxKey = keys.includes(Syntax.OR);
    if (!hasAndSyntaxKey && !hasOrSyntaxKey) {
        result = {
            [Syntax.AND]: extractValues(where)
        };
    } else if (hasAndSyntaxKey && hasOrSyntaxKey && keys.length === 2) {
        result = extractValues(where);
    } else if ((hasAndSyntaxKey || hasOrSyntaxKey) && keys.length > 1) {
        result = {
            [Syntax.AND]: extractValues(where)
        };
    } else if ((hasAndSyntaxKey || hasOrSyntaxKey) && keys.length === 1) {
        const syntaxKey = hasAndSyntaxKey ? Syntax.AND : Syntax.OR;
        result = {
            [syntaxKey]: extractValues(where[syntaxKey])
        };
    }
    /**
     * This should never ever happen, just leave the check in case of some really strange input.
     */
    if (!result) {
        throw new WebinyError("Could not parse the given object.", "PARSE_ERROR", {
            where
        });
    }
    /**
     * If result is an array, take only the first result.
     * If there are more values in the array, something is wrong.
     */
    if (Array.isArray(result) === false) {
        return result;
    }
    if (result.length === 1) {
        return result.shift();
    }
    /**
     * There should be no keys that are no syntax ones in the top level array objects
     */
    let resultHasAnd = false;
    let resultHasOr = false;
    for (const value of result) {
        const rKeys = Object.keys(value);
        if (rKeys.length > 1) {
            throw new WebinyError(
                "Cannot have more than one syntax condition in the top level of the array.",
                "RESULT_SYNTAX_ERROR",
                {
                    result,
                    value
                }
            );
        } else if (rKeys.includes(Syntax.AND)) {
            if (resultHasAnd) {
                throw new WebinyError(
                    "Cannot have more than one AND syntax condition in the top level of the array.",
                    "RESULT_SYNTAX_ERROR",
                    {
                        value
                    }
                );
            }
            resultHasAnd = true;
            continue;
        } else if (rKeys.includes(Syntax.OR)) {
            if (resultHasOr) {
                throw new WebinyError(
                    "Cannot have more than one OR syntax condition in the top level of the array.",
                    "RESULT_SYNTAX_ERROR",
                    {
                        value
                    }
                );
            }
            resultHasOr = true;
            continue;
        }
        throw new WebinyError("Top level object key must be a syntax key.", "RESULT_SYNTAX_ERROR", {
            value,
            keys: rKeys
        });
    }
    return result.reduce((acc: Record<string, string>, value: Record<string, string>) => {
        const rKeys = Object.keys(value);
        const key = rKeys.shift();
        if (!key) {
            return acc;
        }
        acc[key] = value[key];
        return acc;
    }, {} as Record<string, string>);
}
