import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "number",
    execute(value: string) {
        return i18n.number(value);
    }
} as Modifier;
