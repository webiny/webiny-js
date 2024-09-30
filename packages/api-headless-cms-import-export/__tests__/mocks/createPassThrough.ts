import { PassThrough } from "stream";

export const createPassThrough = (): PassThrough => {
    return new PassThrough({
        autoDestroy: true
    });
};
