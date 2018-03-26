import { i18n } from "./..";

export default {
    name: "price",
    execute(value) {
        return i18n.price(value);
    }
};
