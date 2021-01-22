export const setValue = ({ value, bind, field, index }) => {
    let newValue = field.multipleValues ? [...(bind.value || [])] : bind.value;

    if (field.multipleValues) {
        if (index >= 0) {
            newValue[index] = value;
        } else {
            newValue = value;
        }
    } else {
        newValue = value;
    }

    bind.onChange(newValue);
};
