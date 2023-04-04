import trim from "lodash/trim";

export default (value: string): `/${string}` | null => {
    if (typeof value === "string") {
        return `/${trim(value, "/")}`;
    }
    return null;
};
