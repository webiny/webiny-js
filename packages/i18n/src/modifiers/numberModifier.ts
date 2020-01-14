// import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "number",
    execute(value: string) {
        return value // i18n.number(value);
    }
} as Modifier;
