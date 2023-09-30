import AwsLambdaClient from "aws-sdk/clients/lambda";

export class LambdaClient {
    private readonly lambdaClient: AwsLambdaClient;
    private functionNameOrArn: string;

    constructor(functionNameOrArn: string) {
        this.functionNameOrArn = functionNameOrArn;
        this.lambdaClient = new AwsLambdaClient({
            region: process.env.AWS_REGION
        });
    }

    async invokeAndGetResponse(payload: Record<string, any>) {
        const { Payload } = await this.lambdaClient
            .invoke({
                FunctionName: this.functionNameOrArn,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify(payload)
            })
            .promise();

        return JSON.parse(Payload as string);
    }
}
