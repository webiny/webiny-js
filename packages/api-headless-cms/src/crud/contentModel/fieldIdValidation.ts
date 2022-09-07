import { validation } from "@webiny/validation";
import { fieldSystemFields } from "~/crud/contentModel/systemFields";

export const validateFieldId = async (input: string): Promise<void> => {
    await validation.validate(input, "required,maxLength:100");

    const value = String(input || "").trim();

    if (!value.charAt(0).match(/^[a-zA-Z]/)) {
        throw new Error(`Provided ${value} is not valid - must not start with a number.`);
    } else if (value.match(/^([a-zA-Z0-9]+)$/) === null) {
        throw new Error(`Provided ${value} is not valid - must be alphanumeric string.`);
    } else if (fieldSystemFields.includes(value)) {
        throw new Error(`Provided ${value} is not valid - "${value}" is an auto-generated field.`);
    }
};
