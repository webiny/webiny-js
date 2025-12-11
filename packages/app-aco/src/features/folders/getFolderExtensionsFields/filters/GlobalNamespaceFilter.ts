import { FolderExtensionsFieldFilter } from "../abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class GlobalNamespaceFilterImpl implements FolderExtensionsFieldFilter.Interface {
    filter(fields: CmsModelField[]): CmsModelField[] {
        return fields.filter(field => {
            return field.tags!.includes("$namespace:global");
        });
    }
}

export const GlobalNamespaceFilter = FolderExtensionsFieldFilter.createImplementation({
    implementation: GlobalNamespaceFilterImpl,
    dependencies: []
});
