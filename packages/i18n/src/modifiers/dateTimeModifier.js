// @flow
import i18n from "./..";

export default {
    name: "dateTime",
    execute(value: string) {
        return i18n.dateTime(value);
    }
};
