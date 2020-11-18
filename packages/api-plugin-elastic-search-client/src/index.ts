import { Client } from "@elastic/elasticsearch";
import AWS from "aws-sdk";
import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import { ContextPlugin } from "@webiny/handler/types";

interface Params {
    endpoint: string;
}

export default ({ endpoint }: Params): ContextPlugin => {
    return {
        type: "context",
        name: "context-elastic-search",
        apply(context) {
            context.elasticSearch = new Client({
                ...createAwsElasticsearchConnector(AWS.config),
                node: endpoint
            });
        }
    };
};
