import { Client } from "@webiny/api-elasticsearch";
import { IElasticsearchIndexingTaskValuesSettings } from "~/types";

interface GetIndexSettingsParams {
    index: string;
}

interface PutIndexSettingsParams {
    index: string;
    body: {
        index: {
            number_of_replicas: number;
            refresh_interval: string;
        };
    };
}

export const indexSettings: IElasticsearchIndexingTaskValuesSettings = {
    authors: {
        numberOfReplicas: 1,
        refreshInterval: "1s"
    },
    articles: {
        numberOfReplicas: 2,
        refreshInterval: "2s"
    },
    categories: {
        numberOfReplicas: 3,
        refreshInterval: "3s"
    }
};

export interface ExtendedClient extends Client {
    enabled: Set<string>;
    disabled: Set<string>;
}

export const createElasticsearchClientMock = (): ExtendedClient => {
    const enabled = new Set<string>();
    const disabled = new Set<string>();
    return {
        enabled,
        disabled,
        indices: {
            getSettings: async (params: GetIndexSettingsParams) => {
                if (indexSettings[params.index]) {
                    const settings = indexSettings[params.index];
                    return {
                        body: {
                            [params.index]: {
                                settings: {
                                    index: {
                                        number_of_replicas: settings.numberOfReplicas,
                                        refresh_interval: settings.refreshInterval
                                    }
                                }
                            }
                        }
                    };
                }
                return null;
            },
            putSettings: async (params: PutIndexSettingsParams) => {
                if (params.body.index.refresh_interval === "-1") {
                    disabled.add(params.index);
                    enabled.delete(params.index);
                    return;
                }
                disabled.delete(params.index);
                enabled.add(params.index);
            }
        }
    } as unknown as ExtendedClient;
};
