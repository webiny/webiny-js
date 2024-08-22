import path from "path";
import { WebinyError } from "@webiny/error";

interface Params {
    url: string;
    size: number;
}

interface Result {
    url: string;
    size: number;
    key: string;
}

export const convertFromUrlToPathname = (input: Params): Result => {
    let pathname: string | undefined;
    try {
        pathname = new URL(input.url).pathname;
    } catch {
        pathname = path.basename(input.url);
    }
    if (!pathname) {
        throw new WebinyError({
            message: `Failed to get a file pathname from "${input.url}".`,
            code: "FAILED_TO_PARSE_FILE",
            data: {
                input
            }
        });
    }
    return {
        url: input.url,
        key: pathname,
        size: input.size
    };
};
