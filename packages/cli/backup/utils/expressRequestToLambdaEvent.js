module.exports = req => {
    const event = {
        headers: req.headers,
        path: req.path,
        resource: req.path,
        httpMethod: req.method,
        queryStringParameters: req.query,
        pathParameters: req.params
    };

    if (event.headers["content-type"] === "application/json") {
        event.body = JSON.stringify(req.body);
    }

    return event;
};
