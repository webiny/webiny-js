import { validation } from "@webiny/validation";
import { fieldSystemFields } from "~/crud/contentModel/systemFields";

export const validateAlias = async (input: string): Promise<void> => {
    await validation.validate(input, "required,maxLength:100");

    const value = String(input || "").trim();

    if (!value.charAt(0).match(/^[a-zA-Z]/)) {
        throw new Error(`Provided ID ${value} is not valid - must not start with a number.`);
    }
    if (fieldSystemFields.includes(value)) {
        throw new Error(
            `Provided ID ${value} is not valid - "${value}" is an auto-generated field.`
        );
    }
};
