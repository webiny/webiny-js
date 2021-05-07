import WebinyError from "@webiny/error";
import { keyParser } from "./parsers/keyParser";

const AND_SYNTAX = "AND";
const OR_SYNTAX = "OR";
const SYNTAX_KEYS = [AND_SYNTAX, OR_SYNTAX];

interface WhereParserArgs {
    attributes: string[];
    where: Record<string, any>;
}

const isSyntaxCheck = (key: string): boolean => {
    return SYNTAX_KEYS.includes(key);
};
// const isAttributeCheck = (attributes: string[], key: string): boolean => {
//     return attributes.includes(key);
// };
/**
 * What we need to do:
 *  - check that target is array
 *  - check that has no empty values
 *  - check that each object in the array has only one key and it is not an array
 */
const validateSyntaxValue = (target: any): boolean => {
    // in the case target is not defined or not an array
    if (!target || Array.isArray(target) === false || target.length === 0) {
        throw new WebinyError(
            "Value in the syntax keyword must be a non-empty array.",
            "SYNTAX_ERROR",
            {
                target
            }
        );
    }
    // check what is in the array - cannot be empty
    const values = target.filter(v => !!v);
    if (values.lenght === 0 || values.length !== target.length) {
        throw new WebinyError(
            "Value in the syntax keyword cannot have empty values.",
            "SYNTAX_ERROR",
            {
                target
            }
        );
    }
    for (const value of values) {
        if (typeof value !== "object" || Array.isArray(value)) {
            throw new WebinyError(
                "Value in the syntax keyword array must be an object and not an array.",
                "SYNTAX_ERROR",
                {
                    target,
                    value
                }
            );
        }
        const keys = Object.keys(value);
        if (keys.length > 1) {
            throw new WebinyError(
                "Value in the syntax keyword array value cannot have more than one attribute.",
                "SYNTAX_ERROR",
                {
                    target,
                    value
                }
            );
        }
    }
    return true;
};

const extractSyntaxValues = (items?: any[]) => {
    if (!Array.isArray(items)) {
        throw new WebinyError(
            "Cannot send a non-array to extract the values.",
            "SYNTAX_VALUES_ERROR",
            {
                items
            }
        );
    }
    return items.map(item => {
        const keys = Object.keys(item);
        const key = keys.shift();
        const value = item[key];
        const keyParserResult = keyParser(key);
        if (!keyParserResult) {
            throw new WebinyError("Parsed key produces no result.", "KEY_PARSE_ERROR", {
                key
            });
        }
        return {
            ...keyParserResult,
            value
        };
    });
};

const extractValues = (where: any): any => {
    const values = {};
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const value = where[key];
        const isSyntax = isSyntaxCheck(key);

        let syntaxKeyword = AND_SYNTAX;
        /**
         * When key is syntax, its value MUST be an array that is not empty
         */
        if (isSyntax) {
            validateSyntaxValue(value);
            syntaxKeyword = key;
        }
        const keyParserResult = !isSyntax ? keyParser(key) : null;
        if (isSyntax) {
            values[syntaxKeyword] = extractSyntaxValues(value);
        } else if (keyParserResult) {
            if (!values[syntaxKeyword]) {
                values[syntaxKeyword] = [];
            }
            values[syntaxKeyword].push({
                ...keyParserResult,
                value
            });
        } else {
            throw new WebinyError(
                "Key must be either syntax or a parsable attribute with operation.",
                "SYNTAX_ERROR",
                {
                    key,
                    value
                }
            );
        }
    }
    return values;
};
export const whereParser = (args: WhereParserArgs): Record<string, any> => {
    const { where } = args;
    const keys = Object.keys(where || {});
    if (keys.length === 0) {
        return {};
    }
    return extractValues(where);
};
