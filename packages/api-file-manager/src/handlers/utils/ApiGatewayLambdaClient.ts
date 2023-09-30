import { APIGatewayEvent } from "aws-lambda";
import { LambdaClient } from "~/handlers/utils/LambdaClient";

export interface ApiGatewayResponse<TBody extends Record<string, any>> {
    statusCode: number;
    body: TBody;
    headers: Record<string, string>;
}

export class ApiGatewayLambdaClient {
    private lambdaClient: LambdaClient;

    constructor(lambdaClient: LambdaClient) {
        this.lambdaClient = lambdaClient;
    }

    async invokeAndGetResponse<TBody>(event: APIGatewayEvent): Promise<ApiGatewayResponse<TBody>> {
        const response = await this.lambdaClient.invokeAndGetResponse(event);
        return {
            ...response,
            body: JSON.parse(response.body)
        };
    }
}
