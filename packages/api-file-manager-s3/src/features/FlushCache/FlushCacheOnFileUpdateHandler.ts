import { FileBeforeUpdateEventHandler } from "@webiny/api-file-manager/features/file/UpdateFile/events.js";
import { CdnCache } from "@webiny/api-core/features/cdnCache/index.js";
import { CdnPathsGenerator } from "~/utils/CdnPathsGenerator.js";

class FlushCacheOnFileUpdateHandlerImpl implements FileBeforeUpdateEventHandler.Interface {
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(private cdnCache: CdnCache.Interface) {
        this.pathsGenerator = new CdnPathsGenerator();
    }

    async handle(event: FileBeforeUpdateEventHandler.Event): Promise<void> {
        const { file, original } = event.payload;

        const prevAccessControl = original.accessControl;
        const newAccessControl = file.accessControl;

        // Only trigger cache flush if access control type has changed
        if (prevAccessControl?.type === newAccessControl?.type) {
            return;
        }

        const paths = this.pathsGenerator.generate(file.id);

        await this.cdnCache.invalidate({ caller: "fm-before-update", paths });
    }
}

export const FlushCacheOnFileUpdateHandler = FileBeforeUpdateEventHandler.createImplementation({
    implementation: FlushCacheOnFileUpdateHandlerImpl,
    dependencies: [CdnCache]
});
