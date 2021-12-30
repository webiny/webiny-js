exports.handler = async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;
    const response = cf.response;

    const noCache = getHeader(request.headers, "x-webiny-no-cache");
    if (noCache === "true") {
        response.headers["cache-control"] = [
            {
                key: "cache-control",
                value: "private, must-revalidate, max-age=0"
            }
        ];
    }

    return response;
};

function getHeader(headers, header) {
    return headers && headers[header] && headers[header][0].value;
}
