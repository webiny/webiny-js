import { Client } from "@elastic/elasticsearch";

export type Context = {
    elasticSearch: Client;
};
