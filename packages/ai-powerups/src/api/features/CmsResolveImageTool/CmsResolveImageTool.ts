import { AiOutputTool } from "@webiny/api-core/features/ai/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { FileUrlGenerator } from "@webiny/api-file-manager/features/file/FileUrlGenerator/index.js";

class CmsResolveImageToolImpl implements AiOutputTool.Interface {
    readonly name = "cmsResolveImage";

    constructor(
        private getFile: GetFileUseCase.Interface,
        private urlGenerator: FileUrlGenerator.Interface
    ) {}

    async execute(params: Record<string, unknown>): Promise<unknown> {
        const id = params.id;
        if (typeof id !== "string" || !id) {
            return null;
        }

        const result = await this.getFile.execute(id);
        if (result.isFail()) {
            return null;
        }

        return this.urlGenerator.generateUrl(result.value);
    }
}

export const CmsResolveImageTool = AiOutputTool.createImplementation({
    implementation: CmsResolveImageToolImpl,
    dependencies: [GetFileUseCase, FileUrlGenerator]
});
