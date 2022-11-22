import { APIGatewayEvent } from "aws-lambda";
export const createLambdaEvent = (options: Partial<APIGatewayEvent> = {}): APIGatewayEvent => {
    return {
        httpMethod: "POST",
        path: "/webiny",
        body: null,
        ...options
    } as APIGatewayEvent;
};
