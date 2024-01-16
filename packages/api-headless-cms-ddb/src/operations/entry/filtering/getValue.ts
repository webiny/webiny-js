const addArrayResult = (target: any[], result: any[]): void => {
    for (const r of result) {
        if (target.some(t => r === t)) {
            continue;
        }
        target.push(r);
    }
};
/**
 * A recursive function which goes through given input paths and returns the value in it.
 * In case a path is an array, it goes through the array of those values to get values further down the path line.
 */
const find = (target: Record<string, any> | undefined, input: string[]): any[] | undefined => {
    const paths = [...input];
    const path = paths.shift();

    if (!path) {
        return undefined;
    }

    const value = target?.[path];
    if (value === undefined) {
        return undefined;
    }
    if (paths.length === 0) {
        return value;
    } else if (Array.isArray(value)) {
        if (value.length === 0) {
            return undefined;
        }
        return value.reduce<any[]>((collection, v) => {
            const result = find(v, paths);
            if (result === undefined) {
                return collection;
            } else if (Array.isArray(result)) {
                addArrayResult(collection, result);
                return collection;
            }
            collection.push(result);
            return collection;
        }, []);
    }
    return find(value, paths);
};
/**
 * A wrapper function for the find function.
 * Basically it transforms input paths to an array (and runs various checks).
 */
export const getValue = (target: Record<string, any>, input: string | string[]): any => {
    const paths = Array.isArray(input) ? input : input.split(".");
    if (paths.length === 0) {
        throw new Error(`Path is empty!`);
    }
    const filtered = paths.filter(Boolean);
    if (paths.length !== filtered.length) {
        throw new Error(
            `Input path is different than the filtered empty path string. (${paths.join(
                "."
            )} to ${filtered.join(".")})`
        );
    }

    return find(target, paths);
};
