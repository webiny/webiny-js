const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const ssrCache = {};

const createResponse = ({ type, body, isBase64Encoded }) => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": type
        },
        body,
        isBase64Encoded
    };
};

module.exports.handler = async event => {
    let key = event.pathParameters ? event.pathParameters.key : "";
    let type = mime.lookup(key);
    let isBase64Encoded = false;

    console.log("site handler", JSON.stringify(event, null, 2));

    if (!type) {
        type = "text/html";
        if (!ssrCache[event.requestContext.path]) {
            const { handler } = require("./ssr");
            ssrCache[event.requestContext.path] = await handler(event);
        }

        return createResponse({ type, body: ssrCache[event.requestContext.path], isBase64Encoded });
    }

    const filePath = path.resolve(key);

    // TODO: check if file should be base64 encoded

    try {
        let buffer = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        return createResponse({
            type,
            body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
            isBase64Encoded
        });
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
