// @flow
import { trimEnd } from "lodash";

export default ({ page: { url, id }, domain }: Object) => {
    let previewUrl = "";

    if (!domain) {
        previewUrl += url;
        previewUrl += "?preview=" + id;
        return previewUrl;
    }

    previewUrl = "//";

    // Removes protocol from the beggining of the URL.
    previewUrl += domain.replace(/(^\w+:|^)\/\//, "");

    previewUrl = trimEnd(previewUrl, "/");
    previewUrl += url;
    previewUrl += "?preview=" + id;
    return previewUrl;
};
