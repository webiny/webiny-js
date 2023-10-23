import { CmsModelFieldValidation } from "~/types";

export const createRequiredValidation = (): CmsModelFieldValidation => {
    return {
        name: "required",
        message: "Value is required."
    };
};
export const createDateGteValidation = (value: string) => {
    return {
        name: "dateGte",
        message: `Date must be greater than or equal to ${value}.`,
        settings: {
            value
        }
    };
};
export const createDateLteValidation = (value: string) => {
    return {
        name: "dateLte",
        message: `Date must be lesser than or equal to ${value}.`,
        settings: {
            value
        }
    };
};
export const createTimeGteValidation = (value: string) => {
    return {
        name: "timeGte",
        message: `Time must be greater than or equal to ${value}.`,
        settings: {
            value
        }
    };
};

export const createMinLengthValidation = (value: number) => {
    return {
        name: "minLength",
        message: `Value must have at least ${value} items.`,
        settings: {
            value
        }
    };
};
