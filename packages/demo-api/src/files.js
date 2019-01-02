// @flow
import create from "./files/create";
import read from "./files/read";

export async function createFile(event: Object) {
    event.body = event.body ? JSON.parse(event.body) : {};

    try {
        const file = await create(event.body);
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

export async function readFile(event: Object) {
    event.body = event.body ? JSON.parse(event.body) : {};

    try {
        const { src, type } = await read(event.pathParameters.proxy, event.queryStringParameters);

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
