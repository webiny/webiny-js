import { Modifier } from "../types";

export default ({ i18n }): Modifier => ({
    name: "number",
    execute(value: string) {
        return i18n.number(value);
    }
});
