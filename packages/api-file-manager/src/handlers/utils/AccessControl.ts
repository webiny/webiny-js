import { APIGatewayEvent } from "aws-lambda";
import { ApiGatewayLambdaClient } from "~/handlers/utils/ApiGatewayLambdaClient";

interface FileAccess {
    canAccess: boolean;
    isPrivate: boolean;
}

export class AccessControl {
    private readonly lambdaClient: ApiGatewayLambdaClient;
    private readonly headers: Record<string, any>;

    constructor(lambdaClient: ApiGatewayLambdaClient, headers: Record<string, any>) {
        this.headers = headers;
        this.lambdaClient = lambdaClient;
    }

    async canAccess(fileKey: string): Promise<{ canAccess: boolean }> {
        const event = {
            httpMethod: "GET",
            path: "/_internal/fm-can-access-file",
            headers: this.headers,
            queryStringParameters: { fileKey }
        } as any as APIGatewayEvent;

        const response = await this.lambdaClient.invokeAndGetResponse<FileAccess>(event);

        return { canAccess: response.body.canAccess };
    }
}
