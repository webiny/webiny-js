import { FileUrlGenerator as Abstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

class FileUrlGeneratorImpl implements Abstraction.Interface {
    private srcPrefix: Promise<string> | undefined;

    public constructor(private readonly getSettings: GetSettingsUseCase.Interface) {}

    public async generateUrl(file: File): Promise<string> {
        const prefix = await this.getPrefix();
        return prefix + file.key;
    }

    private getPrefix(): Promise<string> {
        if (this.srcPrefix === undefined) {
            this.srcPrefix = (async () => {
                const result = await this.getSettings.execute();
                const settings = result.value;
                return settings?.srcPrefix ?? "";
            })();
        }
        return this.srcPrefix;
    }
}

export const FileUrlGenerator = Abstraction.createImplementation({
    implementation: FileUrlGeneratorImpl,
    dependencies: [GetSettingsUseCase]
});
