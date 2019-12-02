import createResponse from "./createResponse";

const serveError = e => {
    return createResponse({
        statusCode: 404,
        body: e.stack,
        headers: { "Cache-Control": "no-store" }
    });
};

export default serveError;
