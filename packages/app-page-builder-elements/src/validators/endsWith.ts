export default (value: string, param: string) => {
    if (!value || !param) {
        return;
    }

    const endOfTheString = value.slice(value.length - param.length);

    return endOfTheString === param;
};
