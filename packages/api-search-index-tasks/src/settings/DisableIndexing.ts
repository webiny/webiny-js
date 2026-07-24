import { IndexingDisableError } from "~/errors/IndexingDisableError.js";
import { IndexSettingsManager } from "~/abstractions/IndexSettingsManager.js";
import { DisableIndexing as Abstraction } from "./abstractions/DisableIndexing.js";

class DisableIndexingImpl implements Abstraction.Interface {
    constructor(private readonly settings: IndexSettingsManager.Interface) {}

    public async execute(index: string): Promise<Abstraction.Settings> {
        const settings = await this.settings.getSettings(index);

        try {
            await this.settings.setSettings(index, {
                numberOfReplicas: 0,
                refreshInterval: "-1"
            });
        } catch (ex) {
            throw new IndexingDisableError(ex instanceof Error ? ex.message : String(ex));
        }

        return settings;
    }
}

export const DisableIndexing = Abstraction.createImplementation({
    implementation: DisableIndexingImpl,
    dependencies: [IndexSettingsManager]
});
