import { IndexingDisableError } from "~/errors/index.js";
import type { IIndexSettingsValues } from "~/types.js";
import type { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";

export class DisableIndexing {
    private readonly settings: IndexSettingsManager.Interface;

    public constructor(settings: IndexSettingsManager.Interface) {
        this.settings = settings;
    }

    public async exec(index: string): Promise<IIndexSettingsValues> {
        const settings = await this.settings.getSettings(index);

        try {
            await this.settings.setSettings(index, {
                numberOfReplicas: 0,
                refreshInterval: "-1"
            });
        } catch (ex) {
            throw new IndexingDisableError(ex);
        }

        return settings;
    }
}
