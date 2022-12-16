export const getBaseFieldType = (field: { type: string }) => {
    return field.type.split(":")[0];
};
