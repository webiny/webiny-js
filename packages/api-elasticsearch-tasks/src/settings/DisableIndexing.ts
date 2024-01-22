import { IndexingDisableError } from "~/errors";
import { IIndexSettingsValues } from "~/types";
import { IndexSettingsManager } from "./IndexSettingsManager";

export class DisableIndexing {
    private readonly settings: IndexSettingsManager;

    public constructor(settings: IndexSettingsManager) {
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
