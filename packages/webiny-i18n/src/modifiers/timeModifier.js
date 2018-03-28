import i18n from "./..";

export default {
    name: "time",
    execute(value) {
        return i18n.time(value);
    }
};
