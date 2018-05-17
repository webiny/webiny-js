const path = require("path");

// Handle request
exports.router = async (event, context, callback) => {
    const { request } = event.Records[0].cf;

    // If request does not contain a file extension, load one of the apps.
    if (!path.extname(request.uri) || request.uri === "/") {
        request.uri = request.uri.startsWith("/admin") ? "/admin.html" : "/frontend.html";
    }

    callback(null, request);
};
