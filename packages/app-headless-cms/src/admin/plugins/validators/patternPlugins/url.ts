export default {
    type: "cms-field-validator-pattern",
    name: "cms-field-validator-pattern-url",
    pattern: {
        name: "url",
        regex:
            "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
        flags: "i"
    }
};
