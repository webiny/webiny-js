// @flow
import loadPlugin from "./files/loadPlugin";

export async function create(event: Object) {
    event.body = event.body ? JSON.parse(event.body) : {};
    const plugin = loadPlugin();

    try {
        const file = await plugin.create(event.body.src);
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(file, null, 2)
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
}

export async function read(event: Object) {
    event.body = event.body ? JSON.parse(event.body) : {};
    const plugin = loadPlugin();

    try {
        const { src, type } = await plugin.read(
            event.pathParameters.src,
            event.queryStringParameters
        );
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": type
            },
            body: src.toString("base64"),
            isBase64Encoded: true
        };
    } catch (e) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
}
