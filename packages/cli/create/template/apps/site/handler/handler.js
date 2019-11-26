const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const isUtf8 = require("isutf8");
const zlib = require("zlib");

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
        const LambdaClient = require("aws-sdk/clients/lambda");
        const Lambda = new LambdaClient();
        const params = {
            FunctionName: process.env.SSR_FUNCTION,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ url: "/" + key })
        };
        const { Payload } = await Lambda.invoke(params).promise();
        const { html } = JSON.parse(Payload);
        const buffer = zlib.gzipSync(html);

        return createResponse({
            type,
            body: buffer.toString("base64"),
            isBase64Encoded: true,
            headers: {
                "Cache-Control": "public, max-age=60",
                "Content-Encoding": "gzip"
            }
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

        const headers = {};
        if (isUtf8(buffer)) {
            buffer = zlib.gzipSync(buffer);
            headers["Content-Encoding"] = "gzip";
        }

        if (key.includes("static")) {
            headers["Cache-Control"] = "public, max-age=2592000";
        }

        return createResponse({
            type,
            body: buffer.toString("base64"),
            isBase64Encoded: true,
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
