import { Modifier } from "../types";

export default ({ i18n }): Modifier => ({
    name: "price",
    execute(value: string) {
        return i18n.price(value);
    }
});
