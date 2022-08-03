import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { CallbackFunc as LightMyRequestCallback } from "light-my-request";

interface Resolve {
    (response: APIGatewayProxyResult | any): void;
}
interface Reject {
    (error: Error): void;
}

export const createHandleResponse = (
    /**
     * Should be FastifyInstance but for some reason its causing problems for the augmentation.
     */
    app: any,
    resolve: Resolve,
    // eslint-disable-next-line
    _: Reject
): LightMyRequestCallback => {
    return (err, result) => {
        if (err) {
            return resolve({
                statusCode: 500,
                body: JSON.stringify(err),
                headers: {}
            });
        }
        if (app.__webiny_raw_result) {
            return resolve(app.__webiny_raw_result);
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
