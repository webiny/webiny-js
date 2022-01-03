const stageCookie = "webiny-stage";

exports.handler = async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;
    const response = cf.response;

    if (pointsToFile(request.uri)) {
        return response;
    }

    const stage = getHeader(request.headers, "x-webiny-stage");
    if (stage) {
        setResponseCookie(response, `${stageCookie}=${stage}; Secure; Path=/;`);
    }

    const cache = getHeader(request.headers, "x-webiny-cache");
    if (cache === "false") {
        response.headers["cache-control"] = [
            {
                key: "cache-control",
                value: "private, must-revalidate, max-age=0"
            }
        ];
    }

    return response;
};

function pointsToFile(uri) {
    return /\/[^/]+\.[^/]+$/.test(uri);
}

function getHeader(headers, header) {
    return headers && headers[header] && headers[header][0].value;
}

function setResponseCookie(response, cookie) {
    const headers = response.headers;
    const cookies = headers["set-cookie"] || (headers["set-cookie"] = []);

    cookies.push({
        key: "set-cookie",
        value: cookie
    });
}
