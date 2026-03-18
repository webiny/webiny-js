export const required = (v: unknown) => {
    if (v === "" || v === null || v === undefined) {
        throw new Error("This field is required.");
    }
    return true as const;
};
