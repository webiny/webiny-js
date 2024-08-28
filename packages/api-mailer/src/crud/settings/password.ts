import CryptoJS from "crypto-js";
import WebinyError from "@webiny/error";

interface Params {
    value?: string | null;
    secret?: string | null;
}

export const decrypt = (params: Params): string => {
    const { value, secret } = params;
    if (!secret) {
        throw new WebinyError(`Cannot call decrypt without passing the secret.`);
    }
    if (!value) {
        return "";
    }
    try {
        const bytes = CryptoJS.AES.decrypt(value, secret);
        const result = bytes.toString(CryptoJS.enc.Utf8);
        if (!result) {
            console.log(`Error while converting decrypted password bytes into string. `);
            return "";
        }
        return result;
    } catch {
        console.log(`Could not decrypt given encrypted password.`);
    }
    return "";
};

export const encrypt = (params: Params): string => {
    const { value, secret } = params;
    if (!secret) {
        throw new WebinyError(`Cannot call decrypt without passing the secret.`);
    }
    if (!value) {
        return "";
    }
    try {
        return CryptoJS.AES.encrypt(value, secret).toString();
    } catch {
        console.log(`Could not encrypt given password.`);
    }
    return "";
};
