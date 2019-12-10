import createResponse from "./createResponse";

const serveError = e => {
    return createResponse({
        statusCode: 500,
        body: e.message,
        headers: { "Cache-Control": "no-store" }
    });
};

export default serveError;
