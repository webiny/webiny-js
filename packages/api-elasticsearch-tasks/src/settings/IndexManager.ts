import { IndexSettingsManager } from "~/settings/IndexSettingsManager";
import { DisableIndexing } from "./DisableIndexing";
import { EnableIndexing } from "./EnableIndexing";
import { IElasticsearchIndexingTaskValuesSettings, IIndexSettingsValues } from "~/types";
import { IIndexManager } from "~/settings/types";
import { Client } from "@webiny/api-elasticsearch";
import { getObjectProperties } from "@webiny/utils";

const defaultIndexSettings: IIndexSettingsValues = {
    numberOfReplicas: 1,
    refreshInterval: "1s"
};

export interface IListIndicesResponse {
    index: string;
}

export class IndexManager implements IIndexManager {
    private readonly client: Client;
    private readonly disable: DisableIndexing;
    private readonly enable: EnableIndexing;
    private readonly _settings: IElasticsearchIndexingTaskValuesSettings;

    private readonly defaults: IIndexSettingsValues;

    public get settings(): IElasticsearchIndexingTaskValuesSettings {
        return this._settings;
    }

    public constructor(
        client: Client,
        settings: IElasticsearchIndexingTaskValuesSettings,
        defaults?: Partial<IIndexSettingsValues>
    ) {
        const indexSettings = new IndexSettingsManager(client);
        this.client = client;
        this.disable = new DisableIndexing(indexSettings);
        this.enable = new EnableIndexing(indexSettings);
        this._settings = settings;
        this.defaults = {
            refreshInterval: defaults?.refreshInterval || defaultIndexSettings.refreshInterval,
            numberOfReplicas: defaults?.numberOfReplicas || defaultIndexSettings.numberOfReplicas
        };
    }

    public async list(): Promise<string[]> {
        try {
            const response = await this.client.cat.indices<IListIndicesResponse[]>({
                format: "json"
            });
            if (!Array.isArray(response.body)) {
                return [];
            }
            return response.body.map(item => item.index).filter(Boolean);
        } catch (ex) {
            console.error(
                JSON.stringify({
                    message: "Failed to list indices.",
                    error: getObjectProperties(ex)
                })
            );
            return [];
        }
    }

    public async disableIndexing(index: string) {
        /**
         * No need to disable indexing if it's already disabled.
         */
        if (this._settings[index]) {
            return this._settings[index];
        }
        const settings = await this.disable.exec(index);
        this._settings[index] = settings;
        return settings;
    }

    public async enableIndexing(index?: string) {
        if (!index) {
            const indexes = Object.keys(this._settings);
            for (const index of indexes) {
                await this.enableIndexing(index);
            }
            return;
        }
        const settings = this._settings[index] || this.defaults;
        await this.enable.exec(index, settings);
    }

    public async createIndex(index: string, settings?: Record<string, any>): Promise<void> {
        await this.client.indices.create({
            index,
            body: settings
        });
    }

    public async indexExists(index: string): Promise<boolean> {
        const response = await this.client.indices.exists({
            index,
            ignore_unavailable: false,
            allow_no_indices: true,
            include_defaults: true,
            flat_settings: false,
            local: false
        });
        return !!response.body;
    }
}
