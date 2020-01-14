// import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "price",
    execute(value: string) {
        return value //i18n.price(value);
    }
} as Modifier;
