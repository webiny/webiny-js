// Drops keys whose value is `undefined`. Zod copies a key the caller sent as `undefined` into the
// parsed output, so spreading a parsed update onto a stored entity would overwrite that field with
// `undefined`. To an update, an absent key and an `undefined` one both mean "leave the field alone".
export const definedOnly = <T extends object>(value: T): Partial<T> => {
    const defined: Partial<T> = {};

    // `Object.keys` types its result as `string[]`; these are the keys of `value`.
    for (const key of Object.keys(value) as Array<keyof T>) {
        if (value[key] !== undefined) {
            defined[key] = value[key];
        }
    }

    return defined;
};
