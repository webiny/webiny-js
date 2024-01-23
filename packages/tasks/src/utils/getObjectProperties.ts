/**
 * Unfortunately we need some casting as we do not know which properties are available on the object.
 */
interface GenericRecord {
    [key: string]: any;
}

export const getObjectProperties = <T = GenericRecord>(input: unknown): T => {
    if (!input || typeof input !== "object") {
        return {} as unknown as T;
    }
    return Object.getOwnPropertyNames(input).reduce<T>((acc, key) => {
        acc[key as keyof T] = (input as unknown as T)[key as keyof T];
        return acc;
    }, {} as T) as unknown as T;
};
