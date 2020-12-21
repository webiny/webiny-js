import trim from "lodash/trim";

export default (value: string) => {
    if (typeof value === string) {
        return "/" + trim(value, "/");
    }
    return null;
};
