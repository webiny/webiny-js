const setValue = ({ value, bind, field, index }) => {
    let newValue = field.multipleValues ? [...bind.value] : bind.value;
    
    if (field.multipleValues) {
        if (index >= 0) {
            newValue[index] = value;
        } else {
            newValue = value;
        }
    } else {
        
    }

    // Filter out redundant empty values.
    newValue.values = newValue.values.filter(item => !!item.value);
    bind.onChange(newValue);
};

export default setValue;
