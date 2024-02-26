import { PluginsContainer } from "@webiny/plugins";
import { createGzipCompression, getElasticsearchOperators } from "@webiny/api-elasticsearch";
import { createGraphQLFields } from "@webiny/api-headless-cms";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import cmsElasticsearchPlugins from "@webiny/api-headless-cms-ddb-es/elasticsearch";
import { createDynamoDbPlugins } from "@webiny/api-headless-cms-ddb-es/dynamoDb";
import { createObjectStorageTransform } from "@webiny/api-headless-cms/storage/object";
import { createDefaultStorageTransform } from "@webiny/api-headless-cms/storage/default";
import { createFieldConverters } from "@webiny/api-headless-cms/fieldConverters";

const plugins = new PluginsContainer([
    // ddb
    dynamoDbPlugins(),
    // es
    getElasticsearchOperators(),
    createGzipCompression(),
    // cms
    createGraphQLFields(),
    createObjectStorageTransform(),
    createDefaultStorageTransform(),
    createFieldConverters(),
    // cms ddb+es
    createDynamoDbPlugins(),
    cmsElasticsearchPlugins()
]);

export const getPlugins = () => {
    return plugins;
};
