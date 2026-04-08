import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class UrlPatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "url",
        regex: "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
        flags: "i"
    };
}

export const UrlPattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: UrlPatternImpl,
    dependencies: []
});
