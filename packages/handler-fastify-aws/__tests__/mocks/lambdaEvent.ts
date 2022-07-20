import { APIGatewayEvent } from "aws-lambda";
export const createLambdaEvent = (
    options: Partial<APIGatewayEvent> = {}
): Partial<APIGatewayEvent> => {
    return {
        httpMethod: "POST",
        path: "/webiny",
        ...options
    };
};
