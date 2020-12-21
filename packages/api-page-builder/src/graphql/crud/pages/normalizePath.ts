import trimStart from "lodash/trimStart";
import trimEnd from "lodash/trimStart";

export default (value: string) => {
    if (typeof value === string) {
        value = "/" + trimStart(value, "/");
        value = trimEnd(value, "/");
        return value;
    }
    return null;
};
