import i18n from "./..";
import { Modifier } from "../types";

export default {
    name: "time",
    execute(value: string) {
        return i18n.time(value);
    }
} as Modifier;
