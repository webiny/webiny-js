import { CmsValidatorPatternFactory } from "./patternAbstractions.js";
import type { ICmsValidatorPattern } from "./patternAbstractions.js";

const DEFAULT_PATTERNS: ICmsValidatorPattern[] = [
    {
        name: "email",
        label: "E-mail",
        message: "Please enter a valid e-mail.",
        regex: `^\\w[\\+\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    },
    {
        name: "url",
        label: "URL",
        message: "Please enter a valid URL.",
        regex: "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
        flags: "i"
    },
    {
        name: "lowerCase",
        label: "Lower case",
        message: "Only lower case characters are allowed.",
        regex: `^([a-z]*)$`,
        flags: ""
    },
    {
        name: "upperCase",
        label: "Upper case",
        message: "Only upper case characters are allowed.",
        regex: `^([A-Z]*)$`,
        flags: ""
    },
    {
        name: "lowerCaseSpace",
        label: "Lower case + space",
        message: "Only lower case characters and space are allowed.",
        regex: `^([a-z\\s]+)$`,
        flags: ""
    },
    {
        name: "upperCaseSpace",
        label: "Upper case + space",
        message: "Only upper case characters and space are allowed.",
        regex: `^([A-Z\\s]+)$`,
        flags: ""
    }
];

class DefaultPatternFactoryImpl implements CmsValidatorPatternFactory.Interface {
    getPatterns() {
        return DEFAULT_PATTERNS;
    }
}

export const DefaultPatternFactory = CmsValidatorPatternFactory.createImplementation({
    implementation: DefaultPatternFactoryImpl,
    dependencies: []
});
