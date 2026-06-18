import { IndexingDisableError } from "~/errors/index.js";
import type { IIndexSettingsValues } from "~/types.js";
import { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";
import { DisableIndexing as Abstraction } from "./abstractions/DisableIndexing.js";

class DisableIndexingImpl implements Abstraction.Interface {
    constructor(private readonly settings: IndexSettingsManager.Interface) {}

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

export const DisableIndexing = Abstraction.createImplementation({
    implementation: DisableIndexingImpl,
    dependencies: [IndexSettingsManager]
});
