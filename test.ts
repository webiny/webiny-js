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

(async () => {
    const payload = createLambdaEvent({
        queryStringParameters: {
            fileId: "6511b5d5a89d98000881746b"
        },
        headers: {
            "x-tenant": "root",
            Authorization:
                "Bearer eyJraWQiOiIrT2tiY2U2UjNaZ3ZwWHgyQ3hKZFdSelcrOUV3QjVlWVhOMkZpSGlram5ZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkM2Y0Yjg3Mi0wMDIxLTcwOTMtZTQ1Yy1kY2QwMDkwZWU0NTIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfQzVxTjE0ZjZjIiwiY3VzdG9tOmlkIjoiNjQ5NmZiZDdkNjA2MjMwMDA4MWU0NzI3IiwiY29nbml0bzp1c2VybmFtZSI6ImFkbWluQHdlYmlueS5jb20iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbkB3ZWJpbnkuY29tIiwiZ2l2ZW5fbmFtZSI6IlBhdmVsIiwib3JpZ2luX2p0aSI6ImI5NzY4ZjIyLTEyZTAtNDUxYS05NDFhLTBhNDgzMTc2Y2RlMCIsImF1ZCI6IjNya2Y4czFrZWxhbWptMDNnZDQ4a2dtZG50IiwiZXZlbnRfaWQiOiIyNDgwZjU0YS0wNWE0LTRhYWMtYTliZS03Yjg3ODIyYThlZjYiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY5NTQxMTUxOCwiZXhwIjoxNjk1NzU1MDA3LCJpYXQiOjE2OTU3NTE0MDcsImZhbWlseV9uYW1lIjoiRGVuaXNqdWsiLCJqdGkiOiJiMzhiZTAwYy0xMTZlLTQ4NmEtYTA5Ny0zZjMwY2Q3MTY5ZGIiLCJlbWFpbCI6ImFkbWluQHdlYmlueS5jb20ifQ.qJZelBSYgYtj9UWSJXFC3tVM7h9xxYRyPukuVXHHyhbwTwIiVGfdOWOiZEEpDx1Ilbs2czsH4gjpaJNN319WTkWhX5nI_e4ZiaK9MQF2hb5lxSy6tNrDtPOfdb9rKFRc9c_wt3wiKYsIvoqu_wWVxzlPfLE1yI4NPDcUlxni-CMkJzFiZ_ptjtuiFz8pg7objAJfb0DsV8AbkYaNJDgcBzy2AHAROy5C7aoEk-GIjZIi2bfPiMg4x8jazEoq1B7xqINndcSE6Q7Q0_W-Gare1Fu8CFkuggYqdjichqZDXw_8JGonTqghUND3-LLNWid08hV1v9AWHwBXm5khCtrTxA"
        }
    });

    const result = await invokeLambda(payload);

    console.log(result);

    // console.log(JSON.parse(result.body));
})();
