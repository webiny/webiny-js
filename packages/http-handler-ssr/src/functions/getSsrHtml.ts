import LambdaClient from "aws-sdk/clients/lambda";

export default async (ssrFunction, { path }) => {
    const Lambda = new LambdaClient({ region: process.env.AWS_REGION });

    const response = await Lambda.invoke({
        FunctionName: ssrFunction,
        Payload: JSON.stringify({ path })
    }).promise();

    const Payload = JSON.parse(response.Payload as string);
    return Payload.body;
};
