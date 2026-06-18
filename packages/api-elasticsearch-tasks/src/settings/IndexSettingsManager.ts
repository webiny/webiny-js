import { createAbstraction } from "@webiny/feature/api";
import { IndexSettingsGetError, IndexSettingsSetError } from "~/errors/index.js";
import type { IIndexSettingsValues } from "~/types.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

export interface IIndexSettingsManager {
    getSettings(index: string): Promise<IIndexSettingsValues>;
    setSettings(index: string, settings: IIndexSettingsValues): Promise<void>;
}

export const IndexSettingsManager = createAbstraction<IIndexSettingsManager>(
    "ElasticsearchTasks/IndexSettingsManager"
);

export namespace IndexSettingsManager {
    export type Interface = IIndexSettingsManager;
}

class IndexSettingsManagerImpl implements IIndexSettingsManager {
    constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public async getSettings(index: string): Promise<IIndexSettingsValues> {
        try {
            const response = await this.openSearchClient.use().indices.getSettings({
                index
            });

            const setting = response.body[index]?.settings?.index;

            return {
                numberOfReplicas: parseInt(String(setting?.number_of_replicas ?? "0"), 10),
                refreshInterval: setting?.refresh_interval ?? "1s"
            };
        } catch (ex) {
            throw new IndexSettingsGetError(ex, index);
        }
    }

    public async setSettings(index: string, settings: IIndexSettingsValues): Promise<void> {
        try {
            await this.openSearchClient.use().indices.putSettings({
                index,
                body: {
                    index: {
                        number_of_replicas: settings.numberOfReplicas,
                        refresh_interval: settings.refreshInterval
                    }
                }
            });
        } catch (ex) {
            throw new IndexSettingsSetError(ex, index);
        }
    }
}

export const IndexSettingsManagerDI = IndexSettingsManager.createImplementation({
    implementation: IndexSettingsManagerImpl,
    dependencies: [OpenSearchClient]
});
