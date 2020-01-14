// import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "dateTime",
    execute(value: string) {
        return value // i18n.dateTime(value);
    }
} as Modifier;
