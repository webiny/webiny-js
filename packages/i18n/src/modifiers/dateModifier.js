// @flow
import i18n from "./..";

export default {
    name: "date",
    execute(value: string) {
        return i18n.date(value);
    }
};
