import pathLib from "path";
import { Request } from "@webiny/handler/types";

export interface Options {
    original?: string;
    width?: string;
}
/**
 * Based on given request path, extracts file key and additional options sent via query params.
 */
export const extractFileInformation = (request: Request) => {
    const params = request.params as Record<string, any>;
    const path = params["*"];
    return {
        filename: decodeURI(path),
        options: request.query as Options,
        extension: pathLib.extname(path)
    };
};
