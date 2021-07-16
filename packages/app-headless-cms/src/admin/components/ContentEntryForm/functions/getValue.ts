export const getValue = ({ bind, field, index }) => {
    let value = bind.value || null;

    if (field.multipleValues) {
        if (!Array.isArray(value)) {
            value = [];
        }

        if (index >= 0) {
            return value[index] || null;
        }

        return value;
    }

    return value;
};
