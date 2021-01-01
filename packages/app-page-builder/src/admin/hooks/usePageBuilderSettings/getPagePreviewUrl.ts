import { trimEnd } from "lodash";

export default ({ page: { path, id }, websiteUrl }) => {
    let previewUrl = "";

    if (!websiteUrl) {
        previewUrl += path;
        previewUrl += "?preview=" + id;
        return previewUrl;
    }

    previewUrl = "//";

    // Removes protocol from the beginning of the URL.
    previewUrl += websiteUrl.replace(/(^\w+:|^)\/\//, "");

    previewUrl = trimEnd(previewUrl, "/");
    previewUrl += path;
    previewUrl += "?preview=" + id + "&ssr-no-cache";

    return previewUrl;
};
