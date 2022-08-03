import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { CallbackFunc as LightMyRequestCallback } from "light-my-request";

interface Resolve {
    (response: APIGatewayProxyResult): void;
}
interface Reject {
    (error: Error): void;
}

// eslint-disable-next-line
export const createHandleResponse = (resolve: Resolve, _: Reject): LightMyRequestCallback => {
    return (err, result) => {
        if (err) {
            return resolve({
                statusCode: 500,
                body: JSON.stringify(err),
                headers: {}
            });
        }
        const isBase64Encoded =
            !!result.headers["x-base64-encoded"] || !!result.headers["x-binary"];
        const response: APIGatewayProxyResult = {
            statusCode: result.statusCode,
            body: isBase64Encoded ? result.rawPayload.toString("base64") : result.payload,
            headers: result.headers as APIGatewayProxyResult["headers"],
            isBase64Encoded
        };
        return resolve(response);
    };
};
