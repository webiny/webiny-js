import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import type { CmsModelGroup } from "~/types/index.js";
import { CreateGroupUseCase, DeleteGroupUseCase } from "~/exports/api/cms/group.js";

class CmsInstaller implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "Cms";
    readonly dependsOn = [];
    private defaultGroup: CmsModelGroup | undefined;

    public constructor(
        private createGroupUseCase: CreateGroupUseCase.Interface,
        private deleteGroupUseCase: DeleteGroupUseCase.Interface
    ) {}

    async install(): Promise<void> {
        const result = await this.createGroupUseCase.execute({
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: { name: "fas/star", type: "icon" }
        });

        if (result.isFail()) {
            // If the group already exists, we can ignore the error.
            if (result.error.code === "Cms/ModelGroup/SlugTaken") {
                return;
            }
            throw result.error;
        }

        this.defaultGroup = result.value;
    }

    async uninstall(): Promise<void> {
        if (this.defaultGroup) {
            await this.deleteGroupUseCase.execute(this.defaultGroup.id);
        }
    }
}

export default AppInstaller.createImplementation({
    implementation: CmsInstaller,
    dependencies: [CreateGroupUseCase, DeleteGroupUseCase]
});
