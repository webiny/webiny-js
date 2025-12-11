import { FolderExtensionsFieldFilter } from "../abstractions.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class FmFileNamespaceFilterImpl implements FolderExtensionsFieldFilter.Interface {
    constructor(private foldersContext: FoldersContext.Interface) {}

    filter(fields: CmsModelField[]): CmsModelField[] {
        const [folderType] = this.foldersContext.type.split(":");

        // Only apply this filter if folder type is FmFile
        if (folderType !== "FmFile") {
            return [];
        }

        return fields.filter(field => {
            return field.tags!.includes("$namespace:fm_file");
        });
    }
}

export const FmFileNamespaceFilter = FolderExtensionsFieldFilter.createImplementation({
    implementation: FmFileNamespaceFilterImpl,
    dependencies: [FoldersContext]
});
