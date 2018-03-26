import { i18n } from "./..";

export default {
    name: "date",
    execute(value) {
        return i18n.date(value);
    }
};
