import { trimEnd } from "lodash";

export default ({ page: { url, id }, domain, addTimestamp = false }) => {
    let previewUrl = "";

    if (!domain) {
        previewUrl += url;
        previewUrl += "?preview=" + id;
        return previewUrl;
    }

    previewUrl = "//";

    // Removes protocol from the beginning of the URL.
    previewUrl += domain.replace(/(^\w+:|^)\/\//, "");

    previewUrl = trimEnd(previewUrl, "/");
    previewUrl += url;
    previewUrl += "?preview=" + id;

    if (addTimestamp !== false) {
        previewUrl += "&ts=" + new Date().getTime();
    }

    return previewUrl;
};
