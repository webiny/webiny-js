import { trimEnd } from "lodash";

export default ({ page: { url, id }, websiteUrl }) => {
    let previewUrl = "";

    if (!websiteUrl) {
        previewUrl += url;
        previewUrl += "?preview=" + id;
        return previewUrl;
    }

    previewUrl = "//";

    // Removes protocol from the beginning of the URL.
    previewUrl += websiteUrl.replace(/(^\w+:|^)\/\//, "");

    previewUrl = trimEnd(previewUrl, "/");
    previewUrl += url;
    previewUrl += "?preview=" + id + "&ssr-no-cache";

    return previewUrl;
};
