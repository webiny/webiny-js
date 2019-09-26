// @flow
import i18n from "./..";

export default {
    name: "price",
    execute(value: string) {
        return i18n.price(value);
    }
};
