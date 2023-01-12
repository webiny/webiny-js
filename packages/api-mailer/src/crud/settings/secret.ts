import WebinyError from "@webiny/error";

export const getSecret = (): string => {
    const envValue = process.env.WEBINY_MAILER_PASSWORD_SECRET;

    const value = String(envValue).trim();
    if (!envValue || !value) {
        throw new WebinyError(`There must be a password secret defined!`, "PASSWORD_SECRET_ERROR");
    }
    return value;
};
