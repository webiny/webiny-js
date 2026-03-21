import { IndexManager } from "~/settings";
import type { Client } from "@webiny/api-opensearch";
import type { IElasticsearchIndexingTaskValuesSettings } from "~/types";
import { createOpenSearchClientMock } from "~tests/mocks/elasticsearch";

interface Params {
    client?: Client;
    settings?: IElasticsearchIndexingTaskValuesSettings;
}

export const createIndexManagerMock = (params?: Params) => {
    return new IndexManager(params?.client || createOpenSearchClientMock(), params?.settings || {});
};
