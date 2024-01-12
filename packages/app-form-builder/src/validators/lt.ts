export default (value: string | number, param: string | number, equal = false) => {
    if (!value || !param) {
        return false;
    }

    if (equal) {
        return value <= param;
    } else {
        return value < param;
    }
};
