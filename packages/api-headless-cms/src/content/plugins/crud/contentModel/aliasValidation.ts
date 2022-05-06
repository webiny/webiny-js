import { validation } from "@webiny/validation";

const forbiddenAliases = ["id", "entryId", "createdOn", "savedOn", "createdBy", "ownedBy"];

export const aliasValidation = async (value: string): Promise<void> => {
    await validation.validate(value, "maxLength:255");
    if (!value) {
        return;
    }
    if (!value.charAt(0).match(/[a-zA-Z]/)) {
        throw new Error(`Provided Alias ${value} is not valid - must not start with a number.`);
    }
    const v = value.trim().toLowerCase();
    const matched = forbiddenAliases.find(a => a === v);
    if (matched) {
        throw new Error(
            `Provided Alias ${value} is not valid - "${matched}" is an auto-generated field.`
        );
    }
};
