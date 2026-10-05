import { FileUrlGenerator as Abstraction } from "./abstractions.js";
import { FileUrlPrefixProvider } from "./abstractions.js";
import type { File } from "~/domain/file/types.js";

class FileUrlGeneratorImpl implements Abstraction.Interface {
    public constructor(private readonly prefixProvider: FileUrlPrefixProvider.Interface) {}

    public async generateUrl(file: File): Promise<string> {
        const prefix = await this.prefixProvider.getPrefix();
        return prefix + file.key;
    }
}

export const FileUrlGenerator = Abstraction.createImplementation({
    implementation: FileUrlGeneratorImpl,
    dependencies: [FileUrlPrefixProvider]
});
