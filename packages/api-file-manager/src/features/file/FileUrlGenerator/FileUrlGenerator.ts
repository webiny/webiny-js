import { FileUrlGenerator as Abstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

class FileUrlGeneratorImpl implements Abstraction.Interface {
    private srcPrefix = "";

    public constructor(private readonly getSettings: GetSettingsUseCase.Interface) {}

    public generateUrl(file: File): string {
        return this.srcPrefix + file.key;
    }

    public async init(): Promise<void> {
        const result = await this.getSettings.execute();
        const settings = result.value;
        this.srcPrefix = settings?.srcPrefix ?? "";
    }
}

export const FileUrlGenerator = Abstraction.createImplementation({
    implementation: FileUrlGeneratorImpl,
    dependencies: [GetSettingsUseCase]
});
