const resolveFieldValue = (parent, _, __, info) => {
    const { fieldName } = info;
    return parent.values[fieldName];
};

export const generateFieldResolvers = (fieldIds: string[]) => {
    return fieldIds.reduce((previousValue, currentValue) => {
        if (typeof previousValue[currentValue] !== "function") {
            previousValue[currentValue] = resolveFieldValue;
        }
        return previousValue;
    }, {});
};
