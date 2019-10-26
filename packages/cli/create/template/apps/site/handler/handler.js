const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const isUtf8 = require("isutf8");

const createResponse = ({ type, body, isBase64Encoded, headers }) => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": type,
            ...headers
        },
        body,
        isBase64Encoded
    };
};

module.exports.handler = async event => {
    let key = event.pathParameters ? event.pathParameters.key : "";
    let type = mime.lookup(key);
    let isBase64Encoded = false;

    if (key.endsWith("undefined")) {
        return createResponse({
            type,
            body: "",
            isBase64Encoded,
            headers: { "Cache-Control": "public, max-age=60" }
        });
    }

    if (!type) {
        type = "text/html";
        const { html } = await require("./renderer")("/" + key);

        return createResponse({
            type,
            body: html,
            isBase64Encoded,
            headers: { "Cache-Control": "public, max-age=60" }
        });
    }

    const filePath = path.resolve(key);

    try {
        let buffer = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        isBase64Encoded = !isUtf8(buffer);
        const headers = {};

        if (key.includes("static")) {
            headers["Cache-Control"] = "public, max-age=2592000";
        }

        return createResponse({
            type,
            body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
            isBase64Encoded,
            headers
        });
    } catch (e) {
        return {
            statusCode: 404,
            body: e.message,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            }
        };
    }
};
