import { Modifier } from "../types";

export default ({ i18n }): Modifier => ({
    name: "time",
    execute(value: string) {
        return i18n.time(value);
    }
});
