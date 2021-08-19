import * as pulumi from "@pulumi/pulumi";
import DynamoDB from "./dynamoDb";
import Graphql from "./graphql";
import ApiGateway from "./apiGateway";
import Cloudfront from "./cloudfront";

// Among other things, this determines the amount of information we reveal on runtime errors.
// https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
const DEBUG = String(process.env.DEBUG);

// Enables logs forwarding.
// https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

export default () => {
    const dynamoDb = new DynamoDB();

    const api = new Graphql({
        dbTable: dynamoDb.table,
        env: {
            // The single DynamoDB table in which data can be stored and queried.
            DB_TABLE: dynamoDb.table.name,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        }
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
        graphqlApiUrl: pulumi.interpolate`https://${cloudfront.cloudfront.domainName}/graphql`,
        dynamoDbTable: dynamoDb.table.name
    };
};
