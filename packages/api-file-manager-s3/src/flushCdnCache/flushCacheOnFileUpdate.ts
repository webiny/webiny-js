import { ContextPlugin } from "@webiny/api";
import { FileManagerContext, OnFileBeforeUpdateTopicParams } from "@webiny/api-file-manager/types";
import { CdnPathsGenerator } from "~/flushCdnCache/CdnPathsGenerator";

class FlushCacheOnFileUpdate {
    private readonly context: FileManagerContext;
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(context: FileManagerContext) {
        this.pathsGenerator = new CdnPathsGenerator();
        this.context = context;
        context.fileManager.onFileBeforeUpdate.subscribe(this.onFileBeforeUpdate);
    }

    private onFileBeforeUpdate = async ({ file, original }: OnFileBeforeUpdateTopicParams) => {
        const prevAccessControl = original.accessControl;
        const newAccessControl = file.accessControl;

        if (prevAccessControl?.type === newAccessControl?.type) {
            return;
        }

        await this.context.tasks.trigger({
            definition: "cloudfrontInvalidateCache",
            input: {
                caller: "fm-before-update",
                paths: this.pathsGenerator.generate(file)
            }
        });
    };
}

export const flushCacheOnFileUpdate = () => {
    return new ContextPlugin<FileManagerContext>(context => {
        new FlushCacheOnFileUpdate(context);
    });
};
