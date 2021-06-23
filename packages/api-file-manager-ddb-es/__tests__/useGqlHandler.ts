/**
 * We need to load the gql handler from the api-file-manager to be able to test the richTextField plugin
 * (multiple plugins that define new field)
 */
import useGqlHandler from "../../api-file-manager/__tests__/useGqlHandler";
import richTextFieldPlugin from "./mocks/richTextFieldPlugin";
import fileManagerDdbEsPlugins from "../src/index";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import dynamoToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { Client } from "@elastic/elasticsearch";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import { createHandler } from "@webiny/handler-aws";

export default () => {
    const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";
    const elasticsearchClient = new Client({
        node: `http://localhost:${ELASTICSEARCH_PORT}`
    });
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });
    const elasticsearchClientContext = elasticsearchClientContextPlugin({
        endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
    });
    const clearElasticsearch = async () => {
        return elasticsearchClient.indices.delete({
            index: "_all"
        });
    };

    const createElasticsearchIndice = async () => {
        return elasticsearchClient.indices.create({
            index: "root-file-manager",
            body: {
                settings: {
                    analysis: {
                        analyzer: {
                            lowercase_analyzer: {
                                type: "custom",
                                filter: ["lowercase", "trim"],
                                tokenizer: "keyword"
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        property: {
                            type: "text",
                            fields: {
                                keyword: {
                                    type: "keyword",
                                    ignore_above: 256
                                }
                            },
                            analyzer: "lowercase_analyzer"
                        },
                        rawValues: {
                            type: "object",
                            enabled: false
                        }
                    }
                }
            }
        });
    };
    // @ts-ignore
    documentClient.__CUSTOM_ADDED_STUFF = true;
    // Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
    simulateStream(documentClient, createHandler(elasticsearchClientContext, dynamoToElastic()));

    const params: any = {
        plugins: [
            ...richTextFieldPlugin(),
            ...fileManagerDdbEsPlugins(),
            ...dbPlugins({
                table: "FileManager",
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            elasticsearchClientContext,
            ...fileManagerPlugins()
        ],
        extraVariables: {
            createElasticsearchIndice,
            clearElasticsearch
        },
        skipGlobals: true
    };
    return useGqlHandler(params);
};
