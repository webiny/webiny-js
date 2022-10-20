import WebinyError from "@webiny/error";
import { ExtendedTransportSettings, TransportSettings } from "~/types";
import { decrypt, encrypt } from "./password";
import { CmsEntry } from "@webiny/api-headless-cms/types";

interface TransformValuesFromEntryParams {
    entry?: CmsEntry<TransportSettings> | null;
    secret: string | null;
}
export const transformValuesFromEntry = (
    params: TransformValuesFromEntryParams
): ExtendedTransportSettings | null => {
    const { entry, secret } = params;
    if (!secret) {
        throw new WebinyError(
            `There is no secret defined. Without it we cannot decrypt the password.`
        );
    } else if (!entry) {
        return null;
    }
    return {
        id: entry.id,
        ...entry.values,
        password: decrypt({
            value: entry.values["password"],
            secret
        })
    };
};

interface TransformValuesToEntryParams {
    values: TransportSettings;
    secret: string | null;
}
export const transformValuesToEntry = (
    params: TransformValuesToEntryParams
): TransportSettings | null => {
    const { values, secret } = params;

    if (!secret) {
        throw new WebinyError(
            `There is no secret defined. Without it we cannot decrypt the password.`
        );
    }

    return {
        ...values,
        password: encrypt({
            value: values.password,
            secret
        })
    };
};
