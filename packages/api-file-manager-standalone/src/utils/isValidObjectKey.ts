/*
 * A storage key is a relative, `/`-separated path with no empty, `.` or `..` segments and no
 * backslashes. Keys come from file records and upload requests, which clients write, so anything
 * that could climb out of a tenant's folder on disk, or out of its prefix in a bucket, is refused.
 */
export const isValidObjectKey = (key: string): boolean => {
    if (!key || key.includes("\\")) {
        return false;
    }
    return key.split("/").every(segment => {
        return segment !== "" && segment !== "." && segment !== "..";
    });
};
