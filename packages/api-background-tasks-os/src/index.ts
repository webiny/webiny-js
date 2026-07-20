// The OpenSearch background-tasks are DI-native now. background-tasks itself is registered via
// BackgroundTasksFeature (registerApiRequestStack, all flavours); the OS-specific Elasticsearch
// tasks are exposed here as a Feature for the OS flavour to register.
export { ElasticsearchTasksFeature } from "@webiny/api-elasticsearch-tasks";
