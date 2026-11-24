import { Result } from "@webiny/feature/api";
import { InvalidFileKeyError } from "./errors.js";

const isUnsafeSegment = (segment: string) => {
    return segment === "" || segment === "." || segment === "..";
};

/**
 * File keys and IDs end up in storage paths (local disk, S3 object keys). Reject anything that
 * could point outside the tenant's files: absolute paths, `.`/`..` segments, backslashes and NUL bytes.
 */
export const validateFileKey = (input: {
    key: string;
    id?: string;
}): Result<void, InvalidFileKeyError> => {
    const { key, id } = input;
    const isInvalid = (value: string) => {
        return /[\\\0]/.test(value) || value.split("/").some(isUnsafeSegment);
    };

    if (!key || isInvalid(key) || (id !== undefined && (isInvalid(id) || id.includes("/")))) {
        return Result.fail(new InvalidFileKeyError({ key, id }));
    }

    return Result.ok();
};
