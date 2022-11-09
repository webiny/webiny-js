import aws4 from "aws4";

async function handleOriginRequest(event) {
    const { request, config } = event.Records[0].cf;

    const signature = aws4.sign({
        method: "GET",
        path: request.uri,
        service: "s3-object-lambda",
        region: "eu-central-1",
        headers: {
            host: request.origin.custom.domainName,
            "x-amz-cf-id": config.requestId,
            "x-amz-content-sha256": "UNSIGNED-PAYLOAD"
        }
    });

    for (const key in signature.headers) {
        if (key === 'x-amz-cf-id') {
            continue;
        }
        request.headers[key] = [{ key, value: signature.headers[key] }];
    }

    return request;
}

export const handler = event => {
    const { request, config } = event.Records[0].cf;

    if (request["method"] !== "GET" || config.eventType === "origin-request") {
        return handleOriginRequest(event);
    }

    return request;
};