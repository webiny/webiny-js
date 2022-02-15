import { Modifier, ModifierOptions } from "~/types";

export default ({ i18n }: ModifierOptions): Modifier => ({
    name: "date",
    execute(value) {
        return i18n.date(value);
    }
});
