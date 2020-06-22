export const getValues = (valueObject): string[] => {
    if (!valueObject) {
        return [];
    }

    if (Array.isArray(valueObject.values)) {
        return valueObject.values.map(item => item.value);
    }

    return valueObject.value ? [valueObject.value] : [];
};

