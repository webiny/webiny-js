export { AwsOpenSearchClientFactoryFeature } from "~/features/AwsOpenSearchClientFactory/feature.js";
export { createAwsOpenSearchClient } from "./createAwsOpenSearchClient.js";
export { createOpenSearchEntity, createOpenSearchTable } from "./db/index.js";
export type {
    ICreateOpenSearchEntityParams,
    ICreateOpenSearchTableParams,
    IOpenSearchEntity,
    IOpenSearchEntityAttributes
} from "./db/index.js";
