module.exports = {
    resource: "/graphql",
    path: "/graphql",
    httpMethod: "POST",
    headers: {
        accept: "*/*",
        "accept-encoding": "br, gzip, deflate",
        "accept-language": "en-US,en;q=0.9,hr;q=0.8,ru;q=0.7,sr;q=0.6,bs;q=0.5,sl;q=0.4",
        "content-type": "application/json"
    },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
        resourceId: "r9xbvd",
        resourcePath: "/graphql",
        httpMethod: "POST",
        path: "/prod/graphql",
        protocol: "HTTP/1.1",
        stage: "prod"
    },
    body: '{"operationName":null,"variables":{},"query":"{\\n  users { id\\n name\\n }\\n}"}',
    isBase64Encoded: false
};
