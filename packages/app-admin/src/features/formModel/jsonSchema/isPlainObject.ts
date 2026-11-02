import type { PlainObject } from "./PlainObject.js";

export const isPlainObject = (value: unknown): value is PlainObject => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
