import { i18n } from "./..";

export default {
    name: "dateTime",
    execute(value) {
        return i18n.dateTime(value);
    }
};
