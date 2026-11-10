import { FolderTypePermissions } from "@webiny/api-aco/features/folder/FolderTypePermissions/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

const PREFIX = "cms:";

/** Headless CMS folders ("cms:<modelId>") require entry access on that model. */
class CmsFolderPermissionsImpl implements FolderTypePermissions.Interface {
    constructor(
        private accessControl: AccessControl.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    canHandle(type: string): boolean {
        return type.startsWith(PREFIX);
    }

    canRead(type: string): Promise<boolean> {
        return this.canAccessEntries(type, "r");
    }

    canWrite(type: string): Promise<boolean> {
        return this.canAccessEntries(type, "w");
    }

    private async canAccessEntries(type: string, rwd: "r" | "w"): Promise<boolean> {
        const model = await this.getModel.execute(type.slice(PREFIX.length));
        if (model.isFail()) {
            return false;
        }
        return this.accessControl.canAccessEntry({ model: model.value, rwd });
    }
}

export const CmsFolderPermissions = FolderTypePermissions.createImplementation({
    implementation: CmsFolderPermissionsImpl,
    dependencies: [AccessControl, GetModelUseCase]
});
