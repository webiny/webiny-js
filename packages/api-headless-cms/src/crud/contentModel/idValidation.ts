import { validation } from "@webiny/validation";

export const validateId = async (value: string): Promise<void> => {
    await validation.validate(value, "required,maxLength:100");
    if (!value.charAt(0).match(/[a-zA-Z]/)) {
        throw new Error(`Provided ID ${value} is not valid - must not start with a number.`);
    }
    if (value.trim().toLowerCase() === "id") {
        throw new Error(`Provided ID ${value} is not valid - "id" is an auto-generated field.`);
    }
};
