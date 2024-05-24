import {
    ElasticsearchCatCluterHealthStatus,
    IWaitUntilHealthyParams
} from "@webiny/api-elasticsearch";

export type EsHealthChecksParams = Required<IWaitUntilHealthyParams>;

export const DEFAULT_ES_HEALTH_CHECKS_PARAMS: EsHealthChecksParams = {
    minClusterHealthStatus: ElasticsearchCatCluterHealthStatus.Yellow,
    maxProcessorPercent: 80,
    maxRamPercent: 100,
    maxWaitingTime: 90,
    waitingTimeStep: 3
};
