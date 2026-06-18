import type { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { DisableIndexing } from "./DisableIndexing.js";
import { EnableIndexing } from "./EnableIndexing.js";
import type { IElasticsearchIndexingTaskValuesSettings, IIndexSettingsValues } from "~/types.js";
import type { IIndexManager } from "~/settings/types.js";
import type { Client } from "@webiny/api-opensearch";
import { getObjectProperties } from "@webiny/utils";

const defaultIndexSettings: IIndexSettingsValues = {
    numberOfReplicas: 1,
    refreshInterval: "1s"
};

export interface IListIndicesResponse {
    index: string;
}

const indexPrefix = process.env.OPENSEARCH_INDEX_PREFIX || "";
const filterIndex = (item?: string) => {
    if (!item) {
        return false;
    } else if (item.startsWith(".")) {
        return false;
    } else if (indexPrefix) {
        return item.startsWith(indexPrefix);
    }
    return true;
};

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
        indexSettingsManager: IndexSettingsManager.Interface,
        settings: IElasticsearchIndexingTaskValuesSettings,
        defaults?: Partial<IIndexSettingsValues>
    ) {
        this.client = client;
        this.disable = new DisableIndexing(indexSettingsManager);
        this.enable = new EnableIndexing(indexSettingsManager);
        this._settings = settings;
        this.defaults = {
            refreshInterval: defaults?.refreshInterval || defaultIndexSettings.refreshInterval,
            numberOfReplicas: defaults?.numberOfReplicas || defaultIndexSettings.numberOfReplicas
        };
    }

    public async list(): Promise<string[]> {
        try {
            const response = await this.client.cat.indices({
                format: "json"
            });
            if (!Array.isArray(response.body)) {
                return [];
            }
            return response.body
                .map(item => item.index)
                .filter((index): index is string => filterIndex(index));
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
