import LambdaClient from "aws-sdk/clients/lambda";

const GENERATE_SSR_CACHE = /* GraphQL */ `
    mutation generateSsrCache($url: String!) {
        pageBuilder {
            generateSsrCache(url: $url) {
                error {
                    message
                }
            }
        }
    }
`;

export default {
    type: "pb-page-publish",
    name: "pb-page-publish-generate-ssr-cache",
    async callback({ page }) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        const body = JSON.stringify({
            operationName: "generateSsrCache",
            variables: { url: page.url },
            query: GENERATE_SSR_CACHE
        });

        await Lambda.invoke({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: "Event",
            Payload: JSON.stringify({
                httpMethod: "POST",
                body
            })
        }).promise();
    }
};
