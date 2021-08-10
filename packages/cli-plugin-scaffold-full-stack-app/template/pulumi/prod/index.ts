import DynamoDB from "./dynamoDb";
import Graphql from "./graphql";
import ApiGateway from "./apiGateway";
import Cloudfront from "./cloudfront";

export default () => {
    const dynamoDb = new DynamoDB();

    const api = new Graphql({
        dbTable: dynamoDb.table,
        env: {
            DB_TABLE: dynamoDb.table.name,
            DEBUG: String(process.env.DEBUG),
            WEBINY_LOGS_FORWARD_URL: String(process.env.WEBINY_LOGS_FORWARD_URL)
        },
    });

    const apiGateway = new ApiGateway({
        routes: [
            {
                name: "graphql-post",
                path: "/graphql",
                method: "POST",
                function: api.functions.api
            },
            {
                name: "graphql-options",
                path: "/graphql",
                method: "OPTIONS",
                function: api.functions.api
            }
        ]
    });

    const cloudfront = new Cloudfront({ apiGateway });

    return {
        region: process.env.AWS_REGION,
        apiUrl: cloudfront.cloudfront.domainName.apply(value => `https://${value}`),
        dynamoDbTable: dynamoDb.table.name
    };
};
