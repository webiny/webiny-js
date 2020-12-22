import get from "lodash/get";

const getValue = ({ bind, index, name }) => {
    const value = bind.value || [];

    if (index >= 0) {
        return get(value, `${index}.${name}`);
    }

    return value;
};

export default getValue;
