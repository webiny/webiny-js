import { FastifyInstance } from "@webiny/handler/types";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { LightMyRequestCallback } from "fastify";
import { Base64EncodeHeader } from "~/types";

interface Resolve {
    (response: APIGatewayProxyResult | any): void;
}
const createHandleResponse = (app: FastifyInstance, resolve: Resolve): LightMyRequestCallback => {
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
            !!result.headers[Base64EncodeHeader.encoded] ||
            !!result.headers[Base64EncodeHeader.binary];
        const response: APIGatewayProxyResult = {
            statusCode: result.statusCode,
            body: isBase64Encoded ? result.rawPayload.toString("base64") : result.payload,
            headers: result.headers as APIGatewayProxyResult["headers"],
            isBase64Encoded
        };
        return resolve(response);
    };
};

const getPayloadProperty = (
    payload: any,
    prop: string,
    defaults: Record<string, any> = {}
): Record<string, any> => {
    if (payload && typeof payload === "object") {
        const value = payload[prop] ? payload[prop] : {};

        return {
            ...defaults,
            ...value
        };
    }
    return defaults;
};

export interface ExecuteParams {
    app: FastifyInstance;
    url: string;
    payload: any;
}

export const execute = (params: ExecuteParams): Promise<any> => {
    const { app, url, payload } = params;

    const query = getPayloadProperty(payload, "query", {});
    const headers = getPayloadProperty(payload, "headers", {
        ["content-type"]: "application/json"
    });
    const cookies = getPayloadProperty(payload, "cookies", {});

    return new Promise(resolve => {
        app.inject(
            {
                method: "POST",
                url,
                payload: payload || {},
                query,
                headers,
                cookies
            },
            createHandleResponse(app, resolve)
        );
    });
};
