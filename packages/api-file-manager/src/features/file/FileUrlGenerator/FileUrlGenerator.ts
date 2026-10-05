import { FileUrlGenerator as Abstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

class FileUrlGeneratorImpl implements Abstraction.Interface {
    private srcPrefix: Promise<string> | null = null;

    public constructor(private readonly getSettings: GetSettingsUseCase.Interface) {}

    public async generateUrl(file: File): Promise<string> {
        const srcPrefix = await this.getSrcPrefix();
        return srcPrefix + file.key;
    }

    // The settings are read when the first URL is needed, once per instance. A failed read is
    // forgotten, so the next URL tries again.
    private getSrcPrefix(): Promise<string> {
        if (!this.srcPrefix) {
            this.srcPrefix = this.loadSrcPrefix().catch(error => {
                this.srcPrefix = null;
                throw error;
            });
        }
        return this.srcPrefix;
    }

    private async loadSrcPrefix(): Promise<string> {
        const result = await this.getSettings.execute();
        return result.value?.srcPrefix ?? "";
    }
}

export const FileUrlGenerator = Abstraction.createImplementation({
    implementation: FileUrlGeneratorImpl,
    dependencies: [GetSettingsUseCase]
});
