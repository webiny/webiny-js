import { validation } from "@webiny/validation";

const forbiddenFields: string[] = [
    "id",
    "alias",
    "fieldId",
    "createdOn",
    "savedOn",
    "publishedOn",
    "status"
];

export const validateId = async (value: string): Promise<void> => {
    await validation.validate(value, "required,maxLength:100");

    value = value.trim();
    if (value.match(/^([a-zA-Z]+)/) === null) {
        throw new Error(`Provided Field ID ${value} is not valid - must not start with a number.`);
    } else if (value.match(/^([a-zA-Z0-9]+)$/) === null) {
        throw new Error(
            `Provided Field ID ${value} is not valid - contain only alphanumeric characters.`
        );
    } else if (forbiddenFields.includes(value.toLowerCase()) === true) {
        throw new Error(
            `Provided Field ID ${value} is not valid - "${value}" is an auto-generated field.`
        );
    }
};
export const validateAlias = async (value?: string | null): Promise<void> => {
    /**
     * Value must be sent to the API.
     */
    if (value === undefined) {
        await validation.validate(value, "required");
    }
    /**
     * In case when value is null or empty, pretend everything is ok.
     * This means field should not be used via GraphQL.
     */
    value = String(value).trim();
    if (!value) {
        return;
    }
    await validation.validate(value, "maxLength:100");
    if (value.match(/^([a-zA-Z]+)/) === null) {
        throw new Error(`Provided Alias ${value} is not valid - must not start with a number.`);
    } else if (value.match(/^([a-zA-Z0-9]+)$/) === null) {
        throw new Error(
            `Provided Alias ${value} is not valid - contain only alphanumeric characters.`
        );
    } else if (forbiddenFields.includes(value.toLowerCase()) === true) {
        throw new Error(
            `Provided Alias ${value} is not valid - "${value}" is an auto-generated field.`
        );
    }
};
