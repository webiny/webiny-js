import LambdaClient from "aws-sdk/clients/lambda";

export default async (ssrFunction, { path }) => {
    const Lambda = new LambdaClient({ region: process.env.AWS_REGION });

    const response = await Lambda.invoke({
        FunctionName: ssrFunction,
        Payload: JSON.stringify({ path })
    }).promise();

    const payload = JSON.parse(response.Payload as string);
    if (payload.error) {
        throw new Error(payload.body);
    }

    return payload.body;
};
