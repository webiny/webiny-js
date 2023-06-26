/**
 * Converts deep submission meta object into flat object suitable for CSV.
 */
export const flattenSubmissionMeta = (
    obj: Record<string, any>,
    parent: string,
    res: Record<string, string> = {}
) => {
    for (const key in obj) {
        const propName = parent ? parent + "_" + key : key;
        if (typeof obj[key] == "object") {
            flattenSubmissionMeta(obj[key], propName, res);
        } else {
            res[propName] = obj[key];
        }
    }
    return res;
};
