import { Client } from "@elastic/elasticsearch";

export type ElasticSearchClientContext = {
    elasticSearch: Client;
};
