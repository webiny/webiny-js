import i18n from "./i18n";

let namespace = namespace => {
    return base => {
        return i18n.translate(base, namespace);
    };
};

export default namespace;
