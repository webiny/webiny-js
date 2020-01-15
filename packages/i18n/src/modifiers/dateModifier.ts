import { Modifier } from "../types";

export default ({ i18n }): Modifier => ({
    name: "date",
    execute(value) {
        return i18n.date(value);
    }
});
