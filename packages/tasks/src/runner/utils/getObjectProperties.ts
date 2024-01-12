/**
 * Unfortunately we need some casting as we do not know which properties are available on the object.
 */
export const getObjectProperties = <T = Record<string, any>>(input: unknown): T => {
    if (!input || typeof input !== "object") {
        return {} as unknown as T;
    }
    return Object.getOwnPropertyNames(input).reduce<Record<string, any>>((acc, key) => {
        acc[key] = (input as Record<string, any>)[key];
        return acc;
    }, {}) as unknown as T;
};
