import { Modifier, ModifierOptions } from "~/types";

export default ({ i18n }: ModifierOptions): Modifier => ({
    name: "number",
    execute(value: string) {
        return i18n.number(value);
    }
});
