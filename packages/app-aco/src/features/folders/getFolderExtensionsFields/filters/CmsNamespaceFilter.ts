import { FolderExtensionsFieldFilter } from "../abstractions.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class CmsNamespaceFilterImpl implements FolderExtensionsFieldFilter.Interface {
    constructor(private foldersContext: FoldersContext.Interface) {}

    filter(fields: CmsModelField[]): CmsModelField[] {
        const [folderType, modelId] = this.foldersContext.type.split(":");

        // Only apply this filter if folder type is cms
        if (folderType !== "cms") {
            return [];
        }

        return fields.filter(field => {
            const hasModelIdTag = field.tags!.some(tag => tag.startsWith("$modelId:"));

            return hasModelIdTag
                ? field.tags!.includes(`$modelId:${modelId}`)
                : field.tags!.includes("$namespace:cms");
        });
    }
}

export const CmsNamespaceFilter = FolderExtensionsFieldFilter.createImplementation({
    implementation: CmsNamespaceFilterImpl,
    dependencies: [FoldersContext]
});
