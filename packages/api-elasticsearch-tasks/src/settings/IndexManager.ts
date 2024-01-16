import { IndexSettingsManager } from "~/settings/IndexSettingsManager";
import { DisableIndexing } from "./DisableIndexing";
import { EnableIndexing } from "./EnableIndexing";
import { IElasticsearchIndexingTaskValuesSettings } from "~/types";
import { IIndexManager } from "~/settings/types";
import { Client } from "@webiny/api-elasticsearch";

const defaultIndexSettings = {
    numberOfReplicas: 1,
    refreshInterval: "1s"
};

export class IndexManager implements IIndexManager {
    private readonly disable: DisableIndexing;
    private readonly enable: EnableIndexing;
    private readonly _settings: IElasticsearchIndexingTaskValuesSettings;

    public get settings(): IElasticsearchIndexingTaskValuesSettings {
        return this._settings;
    }

    public constructor(client: Client, settings: IElasticsearchIndexingTaskValuesSettings) {
        const indexSettings = new IndexSettingsManager(client);
        this.disable = new DisableIndexing(indexSettings);
        this.enable = new EnableIndexing(indexSettings);
        this._settings = settings;
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
        const settings = this._settings[index] || defaultIndexSettings;
        await this.enable.exec(index, settings);
    }
}
