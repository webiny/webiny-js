const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");

module.exports.handler = async event => {
    const { key } = event.pathParameters;
    const type = mime.lookup(key);

    const filePath = path.resolve(".files", key);

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
