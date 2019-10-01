/**
 * We need to respond with adequate CORS headers.
 * @type {{"Access-Control-Allow-Origin": string, "Access-Control-Allow-Credentials": boolean}}
 */
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
};

module.exports = (handler) => async event => {
    if (event.httpMethod === "OPTIONS") {
        return {
            body: "",
            statusCode: 204,
            headers
        };
    }

    try {
        const results = await handler(event);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                error: false,
                data: results,
                message: null
            })
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: true,
                data: null,
                message: e.message
            })
        };
    }
};
