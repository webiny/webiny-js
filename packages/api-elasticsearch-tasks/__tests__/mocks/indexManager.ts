import { IndexManager } from "~/settings";
import { Client } from "@webiny/api-elasticsearch";
import { IElasticsearchIndexingTaskValuesSettings } from "~/types";
import { createElasticsearchClientMock } from "~tests/mocks/elasticsearch";

interface Params {
    client?: Client;
    settings?: IElasticsearchIndexingTaskValuesSettings;
}

export const createIndexManagerMock = (params?: Params) => {
    return new IndexManager(
        params?.client || createElasticsearchClientMock(),
        params?.settings || {}
    );
};
