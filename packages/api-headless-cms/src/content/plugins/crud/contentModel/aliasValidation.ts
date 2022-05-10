import { validation } from "@webiny/validation";
import camelCase from "lodash/camelCase";

const forbiddenAliases = ["id", "entryId", "createdOn", "savedOn", "createdBy", "ownedBy"];

export const aliasValidation = async (value: string): Promise<void> => {
    await validation.validate(value, "required,maxLength:255");
    if (!value) {
        return;
    }
    if (!value.charAt(0).match(/[a-zA-Z]/)) {
        throw new Error(`Provided Alias ${value} is not valid - must not start with a number.`);
    }
    const v = camelCase(value.trim());
    if (v !== value) {
        throw new Error(`Provided Alias ${value} is not valid - must be a camel cased string.`);
    }
    const matched = forbiddenAliases.find(a => a.toLowerCase() === v.toLowerCase());
    if (matched) {
        throw new Error(
            `Provided Alias ${value} is not valid - "${matched}" is an auto-generated field.`
        );
    }
};
