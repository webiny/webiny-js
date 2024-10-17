import { createHandler } from "@webiny/handler-aws";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { IInvokeCb } from "~tests/handlers/types";

export interface ICreateInvokeParams {
    handler: ReturnType<typeof createHandler>;
    path: string;
    lambdaContext: LambdaContext;
}

export const createInvoke = ({
    handler,
    path,
    lambdaContext
}: ICreateInvokeParams): IInvokeCb<unknown> => {
    return async params => {
        const { httpMethod = "POST", headers, body, ...rest } = params;
        const response = await handler(
            {
                /**
                 * If no path defined, use /graphql as we want to make request to main api
                 */
                path,
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            lambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };
};
