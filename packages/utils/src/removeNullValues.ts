type WithoutNullableKeys<Type> = {
    [Key in keyof Type]-?: WithoutNullableKeys<NonNullable<Type[Key]>>;
};

export const removeNullValues = <T extends Record<string, any>>(target: T) => {
    const result = {} as WithoutNullableKeys<T>;
    for (const key in target) {
        if (target[key] === null) {
            continue;
        }

        result[key] = target[key];
    }
    return result;
};
