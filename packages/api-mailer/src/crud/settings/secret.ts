import WebinyError from "@webiny/error";

export const getSecret = (): string => {
    const value = String(process.env.WEBINY_MAILER_PASSWORD_SECRET).trim();
    if (!value) {
        throw new WebinyError(`There must be a password secret defined!`, "PASSWORD_SECRET_ERROR");
    }
    return value;
};
