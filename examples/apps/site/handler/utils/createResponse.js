const createResponse = ({
    statusCode = 200,
    type = "text/html",
    body = "",
    isBase64Encoded = false,
    headers = {}
}) => {
    return {
        statusCode,
        body,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": type,
            ...headers
        },
        isBase64Encoded
    };
};

export default createResponse;
