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
            await this.settings.setSettings(index, {
                ...settings
            });
        } catch (ex) {
            throw new IndexingEnableError(ex);
        }
    }
}
