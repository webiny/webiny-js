import pathLib from "path";
import { Request } from "@webiny/handler/types";

/**
 * Based on given request path, extracts file key and additional options sent via query params.
 */
export const extractFileInformation = (request: Request) => {
    const path = (request.params as any)["*"];
    return {
        filename: decodeURI(path),
        options: request.query as any,
        extension: pathLib.extname(path)
    };
};
