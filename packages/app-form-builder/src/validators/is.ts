export default (value: string | string[], param: string) => {
    if (!value || !param) {
        return false;
    }

    if (typeof param === "object") {
        return value.includes(param);
    } else {
        return value === param;
    }
};
