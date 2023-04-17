export const removeUndefinedValues = <T extends Record<string, any>>(target: T) => {
    const result = {} as T;
    for (const key in target) {
        if (target[key] === undefined) {
            continue;
        }

        result[key] = target[key];
    }
    return result;
};
