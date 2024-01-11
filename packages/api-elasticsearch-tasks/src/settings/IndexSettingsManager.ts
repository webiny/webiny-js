import { Client } from "@webiny/api-elasticsearch";
import { IndexSettingsGetError, IndexSettingsSetError } from "~/errors";
import { IIndexSettingsValues } from "~/types";

export class IndexSettingsManager {
    private readonly elasticsearch: Client;

    public constructor(elasticsearch: Client) {
        this.elasticsearch = elasticsearch;
    }

    public async getSettings(index: string): Promise<IIndexSettingsValues> {
        try {
            const response = await this.elasticsearch.indices.getSettings({
                index
            });

            const setting = response.body[index].settings.index;

            return {
                numberOfReplicas: setting.number_of_replicas,
                refreshInterval: setting.refresh_interval
            };
        } catch (ex) {
            throw new IndexSettingsGetError(ex, index);
        }
    }

    public async setSettings(index: string, settings: IIndexSettingsValues): Promise<void> {
        try {
            await this.elasticsearch.indices.putSettings({
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
