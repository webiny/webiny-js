const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");

const isStaticAsset = resource => resource.includes(".");

const BUILD_PATH = __dirname;

const getFile = async key => {
    const type = mime.lookup(key);

    const filePath = key.startsWith("files/")
        ? path.resolve(".files", key.replace("files/", ""))
        : path.join(BUILD_PATH, key);

    try {
        let buffer = await fs.readFile(filePath);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": type
            },
            body: buffer.toString("base64"),
            isBase64Encoded: true
        };
    } catch (e) {
        return {
            statusCode: 404,
            body: e.message,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
};

module.exports.handler = async event => {
    const { resource } = event.pathParameters;

    if (isStaticAsset(resource)) {
        return getFile(resource);
    }

    // Try SSR
    const ssrBundle = path.join(BUILD_PATH, "ssr.js");
    if (fs.existsSync(ssrBundle)) {
        const { handler } = require(ssrBundle);
        return handler(event);
    }

    // Return default index.html
    return getFile("index.html");
};
