import { Modifier, ModifierOptions } from "~/types";

export default ({ i18n }: ModifierOptions): Modifier => ({
    name: "dateTime",
    execute(value: string) {
        return i18n.dateTime(value);
    }
});
