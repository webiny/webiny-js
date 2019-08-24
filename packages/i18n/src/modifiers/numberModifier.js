// @flow
import i18n from "./..";

export default {
    name: "number",
    execute(value: string) {
        return i18n.number(value);
    }
};
