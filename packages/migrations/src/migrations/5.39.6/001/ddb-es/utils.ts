import {
    ElasticsearchCatClusterHealthStatus,
    IWaitUntilHealthyParams
} from "@webiny/api-elasticsearch";

export type EsHealthChecksParams = Required<IWaitUntilHealthyParams>;

export const DEFAULT_ES_HEALTH_CHECKS_PARAMS: EsHealthChecksParams = {
    minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
    maxProcessorPercent: 90,
    maxRamPercent: 100,
    maxWaitingTime: 90,
    waitingTimeStep: 2
};
