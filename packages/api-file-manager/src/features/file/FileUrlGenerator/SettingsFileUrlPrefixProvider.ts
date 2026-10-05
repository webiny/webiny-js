import { FileUrlPrefixProvider as Abstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";

class SettingsFileUrlPrefixProviderImpl implements Abstraction.Interface {
    private prefix: Promise<string> | null = null;

    public constructor(private readonly getSettings: GetSettingsUseCase.Interface) {}

    // Read once per instance, when the first URL is needed. A failed read is forgotten, so the next
    // call tries again.
    public getPrefix(): Promise<string> {
        if (!this.prefix) {
            this.prefix = this.loadPrefix().catch(error => {
                this.prefix = null;
                throw error;
            });
        }
        return this.prefix;
    }

    private async loadPrefix(): Promise<string> {
        const result = await this.getSettings.execute();
        return result.value?.srcPrefix ?? "";
    }
}

export const SettingsFileUrlPrefixProvider = Abstraction.createImplementation({
    implementation: SettingsFileUrlPrefixProviderImpl,
    dependencies: [GetSettingsUseCase]
});
