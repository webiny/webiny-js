import i18n from "./i18n";

export default namespace => {
    return base => {
        return i18n.translate(base, namespace);
    };
};
