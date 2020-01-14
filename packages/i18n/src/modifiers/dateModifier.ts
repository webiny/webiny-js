// import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "date",
    execute(value: string) {
        return value // i18n.date(value);
    }
} as Modifier;
