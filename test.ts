import { APIGatewayEvent } from "aws-lambda";
import LambdaClient from "aws-sdk/clients/lambda";

const createLambdaEvent = (options: Partial<APIGatewayEvent> = {}): APIGatewayEvent => {
    return {
        httpMethod: "GET",
        path: "/_internal/fm-can-access-file",
        body: null,
        ...options
    } as APIGatewayEvent;
};

const invokeLambda = async (payload: any) => {
    const lambdaClient = new LambdaClient({
        region: "eu-central-1"
    });

    const { Payload } = await lambdaClient
        .invoke({
            FunctionName: "arn:aws:lambda:eu-central-1:656932293860:function:wby-graphql-b721688",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(payload)
        })
        .promise();

    return JSON.parse(Payload);
};

const token = `eyJraWQiOiIrT2tiY2U2UjNaZ3ZwWHgyQ3hKZFdSelcrOUV3QjVlWVhOMkZpSGlram5ZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkM2Y0Yjg3Mi0wMDIxLTcwOTMtZTQ1Yy1kY2QwMDkwZWU0NTIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfQzVxTjE0ZjZjIiwiY3VzdG9tOmlkIjoiNjQ5NmZiZDdkNjA2MjMwMDA4MWU0NzI3IiwiY29nbml0bzp1c2VybmFtZSI6ImFkbWluQHdlYmlueS5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbkB3ZWJpbnkuY29tIiwiZ2l2ZW5fbmFtZSI6IlBhdmVsIiwib3JpZ2luX2p0aSI6ImI5NzY4ZjIyLTEyZTAtNDUxYS05NDFhLTBhNDgzMTc2Y2RlMCIsImF1ZCI6IjNya2Y4czFrZWxhbWptMDNnZDQ4a2dtZG50IiwiZXZlbnRfaWQiOiIyNDgwZjU0YS0wNWE0LTRhYWMtYTliZS03Yjg3ODIyYThlZjYiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY5NTQxMTUxOCwiZXhwIjoxNjk1OTg1Mjg2LCJpYXQiOjE2OTU5ODE2ODYsImZhbWlseV9uYW1lIjoiRGVuaXNqdWsiLCJqdGkiOiI3YWZiNWJhMS02MzFlLTQ0ZmItYTI4ZS0yZWU1YzFmMDdmYmEiLCJlbWFpbCI6ImFkbWluQHdlYmlueS5jb20ifQ.eP4TsihJcoj-NRkO1_cyN35Opxc0gRF58tGaVbXAnUeoRLBf06CgVBeU-CBhHH342X8xuveLdElrrcgFpim_x20CCvO0Y14r0-RIAbrQTs7H8ay1g3Pmpj-BJdiet_7phM7gErNAtGMhWH5EqCFrTmM5-IOdxAOXqdB_-VkM4IdYHJ0-8hHnn_qhaTmFYlooBP0R0fykiIL13wKTZzJ2gM60JvIrGYYSHRB8aC51ml9bh2_QVh8aI8MYefXR38gK6XrMrUrOcGKnc2BAvHL7OCaBchqlg3MVGPPMSdwtTQFC9ETYZ9zGKZXB6TEcOBuUujfQQ-1a43yNIPIHJnilFg`;

(async () => {
    const payload = createLambdaEvent({
        queryStringParameters: {
            fileKey: "6499c8a84ceda200084d9986/image-12.jpg"
        },
        headers: {
            "x-tenant": "root",
            Cookie: `wby-id-token=${token}`
        }
    });

    const result = await invokeLambda(payload);

    console.log(result);

    console.log(JSON.parse(result.body));
})();
