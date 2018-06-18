// @flow
import i18n from "./..";

export default {
    name: "time",
    execute(value: string) {
        return i18n.time(value);
    }
};
