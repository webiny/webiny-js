import { IndexSettingsManager as Abstraction } from "./abstractions/IndexSettingsManager.js";
import { IndexSettingsGetError, IndexSettingsSetError } from "~/errors/index.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

class IndexSettingsManagerImpl implements Abstraction.Interface {
    constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public async getSettings(index: string): Promise<Abstraction.Settings> {
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

    public async setSettings(index: string, settings: Abstraction.Settings): Promise<void> {
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

export const IndexSettingsManager = Abstraction.createImplementation({
    implementation: IndexSettingsManagerImpl,
    dependencies: [OpenSearchClient]
});
