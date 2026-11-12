import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { CdnPathsGenerator } from "~/utils/CdnPathsGenerator.js";

class FlushCacheOnFileDeleteHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(private cdnCache: CdnCache.Interface) {
        this.pathsGenerator = new CdnPathsGenerator();
    }

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        const paths = this.pathsGenerator.generate(file.id);

        await this.cdnCache.invalidate({ caller: "fm-before-delete", paths });
    }
}

export const FlushCacheOnFileDeleteHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: FlushCacheOnFileDeleteHandlerImpl,
    dependencies: [CdnCache]
});
