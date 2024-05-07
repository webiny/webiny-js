import { GenericRecord } from "@webiny/app/types";
import { sha1 } from "crypto-hash";

export type ICreateCacheKeyInput = string | GenericRecord | ICreateCacheKeyInput[];

const createKey = (input: ICreateCacheKeyInput): string => {
    if (typeof input === "string") {
        return input;
    }
    return JSON.stringify(input);
};

export const createCacheKey = (input: ICreateCacheKeyInput): Promise<string> => {
    const key = createKey(input);

    return sha1(key, {
        outputFormat: "hex"
    });
};
