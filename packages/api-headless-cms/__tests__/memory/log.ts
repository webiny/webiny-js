import { GenericRecord } from "@webiny/api/types";

export const log = (message: string | GenericRecord | string[], debug = "true") => {
    if (process.env.DEBUG !== debug) {
        return;
    }
    console.log(message);
};
