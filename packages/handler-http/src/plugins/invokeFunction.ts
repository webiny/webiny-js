import LambdaClient from "aws-sdk/clients/lambda";

export default {
    type: "invoke-function",
    invoke({ name, payload, await }) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        return Lambda.invoke({
            FunctionName: name,
            InvocationType: await ? "RequestResponse" : "Event",
            Payload: JSON.stringify(payload)
        }).promise();
    }
};
