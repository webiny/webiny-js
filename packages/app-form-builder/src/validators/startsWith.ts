export default (value: string, param: string) => {
    if (!value || !param) {
        return;
    }

    const startOfString = value.slice(0, param.length);

    return startOfString === param;
};
