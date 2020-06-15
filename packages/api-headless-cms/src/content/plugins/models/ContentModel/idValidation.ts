import { validation } from "@webiny/validation";

export default async (value: string) => {
    await validation.validate(value, "required,maxLength:100");
    if (!value.charAt(0).match(/[a-zA-Z]/)) {
        throw new Error(`Provided ID ${value} is not valid - must not start with a number.`);
    }
};
