export const removeNullValues = <T extends Record<string, any>>(target: T): T => {
    const result = {} as T;
    for (const key in target) {
        if (target[key] === null) {
            continue;
        }

        result[key] = target[key];
    }
    return result as T;
};
