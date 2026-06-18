import { IndexingEnableError } from "~/errors/index.js";
import type { IIndexSettingsValues } from "~/types.js";
import { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";
import { EnableIndexing as Abstraction } from "./abstractions/EnableIndexing.js";

class EnableIndexingImpl implements Abstraction.Interface {
    constructor(private readonly settings: IndexSettingsManager.Interface) {}

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

export const EnableIndexing = Abstraction.createImplementation({
    implementation: EnableIndexingImpl,
    dependencies: [IndexSettingsManager]
});
