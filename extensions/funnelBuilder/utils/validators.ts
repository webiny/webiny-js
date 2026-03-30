/* Form field validators (throw on failure, return true on success). */

export const required = (v: unknown) => {
    if (v === "" || v === null || v === undefined) {
        throw new Error("This field is required.");
    }
    return true as const;
};

/* Value validators used by model validator classes. */

export const minLength = (value: string, threshold: number) => {
    return value.length >= threshold;
};

export const maxLength = (value: string, threshold: number) => {
    return value.length <= threshold;
};

export const gte = (value: number, threshold: number) => {
    return value >= threshold;
};

export const lte = (value: number, threshold: number) => {
    return value <= threshold;
};
