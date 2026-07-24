import type {
    IIndexSettings,
    IIndexSettingsMap,
    IIndexManager
} from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";
import type { DisableIndexing } from "@webiny/api-search-index-tasks/settings/abstractions/DisableIndexing.js";
import type { EnableIndexing } from "@webiny/api-search-index-tasks/settings/abstractions/EnableIndexing.js";
import type { Client } from "@webiny/api-opensearch";
import type { GenericRecord } from "@webiny/api/types.js";
import { getObjectProperties } from "@webiny/utils";

export interface IListIndicesResponse {
    index: string;
}

const defaultIndexSettings: IIndexSettings = {
    numberOfReplicas: 1,
    refreshInterval: "1s"
};

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

export class OsIndexManager implements IIndexManager {
    private readonly client: Client;
    private readonly disable: DisableIndexing.Interface;
    private readonly enable: EnableIndexing.Interface;
    private readonly _settings: IIndexSettingsMap;
    private readonly defaults: IIndexSettings;

    public get settings(): IIndexSettingsMap {
        return this._settings;
    }

    public constructor(
        client: Client,
        disableIndexing: DisableIndexing.Interface,
        enableIndexing: EnableIndexing.Interface,
        settings: IIndexSettingsMap,
        defaults?: Partial<IIndexSettings>
    ) {
        this.client = client;
        this.disable = disableIndexing;
        this.enable = enableIndexing;
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

    public async disableIndexing(index: string): Promise<IIndexSettings> {
        if (this._settings[index]) {
            return this._settings[index];
        }
        const settings = await this.disable.execute(index);
        this._settings[index] = settings;
        return settings;
    }

    public async enableIndexing(index?: string): Promise<void> {
        if (!index) {
            const indexes = Object.keys(this._settings);
            for (const index of indexes) {
                await this.enableIndexing(index);
            }
            return;
        }
        const settings = this._settings[index] || this.defaults;
        await this.enable.execute(index, settings);
    }

    public async createIndex(index: string, settings?: GenericRecord): Promise<void> {
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
