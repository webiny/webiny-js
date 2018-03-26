import { i18n } from "./..";

export default {
    name: "number",
    execute(value) {
        return i18n.number(value);
    }
};
