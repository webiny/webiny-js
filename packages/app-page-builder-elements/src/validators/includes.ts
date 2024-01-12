export default (value: string, param: string) => {
    if (!value || !param) {
        return false;
    }

    return value.includes(param);
};
