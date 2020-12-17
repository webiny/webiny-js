import set from "lodash/set";

const setValue = ({ value, bind, index, name }) => {
    let newValue = [...(bind.value || [])];
    if (index >= 0) {
        set(newValue, `${index}.${name}`, value);
    } else {
        newValue = value;
    }
    bind.onChange(newValue);
};

export default setValue;
