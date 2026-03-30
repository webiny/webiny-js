import objectHash from "object-hash";

export const createObjectHash = (obj: any): string => {
    return objectHash(obj, {
        unorderedArrays: true,
        unorderedSets: true,
        unorderedObjects: true,
        respectFunctionProperties: false
    });
};
