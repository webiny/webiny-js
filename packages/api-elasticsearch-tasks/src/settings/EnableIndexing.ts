import { IndexingEnableError } from "~/errors";
import { IIndexSettingsValues } from "~/types";
import { IndexSettingsManager } from "./IndexSettingsManager";

export class EnableIndexing {
    private readonly settings: IndexSettingsManager;

    public constructor(settings: IndexSettingsManager) {
        this.settings = settings;
    }

    public async exec(index: string, settings: IIndexSettingsValues): Promise<void> {
        try {
            const refreshInterval = parseInt(settings.refreshInterval || "", 10) || 0;
            await this.settings.setSettings(index, {
                ...settings,
                numberOfReplicas: settings.numberOfReplicas < 1 ? 1 : settings.numberOfReplicas,
                refreshInterval: refreshInterval <= 0 ? "1s" : settings.refreshInterval
            });
        } catch (ex) {
            throw new IndexingEnableError(ex);
        }
    }
}
