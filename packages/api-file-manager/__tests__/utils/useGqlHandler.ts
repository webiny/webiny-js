import { createHandler } from "@webiny/handler-aws";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { until } from "@webiny/project-utils/testing/helpers/until";
import type { HandlerParams } from "./plugins";
import { handlerPlugins } from "./plugins";
import { defaultIdentity } from "~tests/utils/tenancySecurity";
import { createFileManagerSdk } from "~tests/utils/createFileManagerSdk.js";

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export default (params: HandlerParams = {}) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: handlerPlugins(params)
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const sdk = createFileManagerSdk(invoke);

    return {
        until,
        handler,
        invoke,
        identity: params.identity || defaultIdentity,
        ...sdk
    };
};
