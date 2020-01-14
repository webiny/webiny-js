//
import { Modifier } from "../types";

export default {
    name: "time",
    execute(value: string) {
        return value; // i18n.time(value);
    }
} as Modifier;
