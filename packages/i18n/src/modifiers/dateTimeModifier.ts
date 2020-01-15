import { Modifier } from "../types";

export default ({ i18n }): Modifier => ({
    name: "dateTime",
    execute(value: string) {
        return i18n.dateTime(value);
    }
});
