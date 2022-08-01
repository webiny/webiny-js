function sanitizeRequestURI(uri) {
    // Make sure that `/` is not appended to index.html, or any path with extension.
    // We remove all slashes, filter out empty values, and reconstruct the path following
    // the fact that every page (slug) has a dedicated folder in the S3 bucket, and an `index.html`
    // file with the actual page HTML.
    var parts = uri.split("/").filter(Boolean);

    // This means that a `/` (homepage) was requested. When the homepage is prerendered, we place its files
    // into the root of the bucket, or in the tenant subfolder, if it's a multi-tenant system, e.g., `/root/index.html`.
    if (!parts.length) {
        return "/index.html";
    }

    var lastPart = parts[parts.length - 1];

    // If there's a `.` in the last part of the path, we assume it's a file extension.
    // In this case, we can reconstruct the path by joining parts with slashes.
    if (lastPart.includes(".")) {
        return [""].concat(parts).join("/");
    }

    // Otherwise, we assume it's a page slug, which needs to point to page's subfolder.
    // We construct a valid S3 bucket path to an HTML file.
    return [""].concat(parts).concat("index.html").join("/");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handler(event) {
    var request = event.request;

    request.uri = sanitizeRequestURI(request.uri);

    return request;
}
