import type { GenericRecord } from "~/GenericRecord.js";

/**
 * This will help with output of the error object.
 * Normally, the error object is not serializable, so we need to convert it to a plain object.
 */
export const convertException = (error: Error, remove?: string[]): GenericRecord => {
    const properties = Object.getOwnPropertyNames(error) as (keyof Error)[];
    return properties.reduce<GenericRecord>((items, property) => {
        if (remove && remove.includes(property)) {
            return items;
        }
        items[property] = error[property];
        return items;
    }, {});
};
