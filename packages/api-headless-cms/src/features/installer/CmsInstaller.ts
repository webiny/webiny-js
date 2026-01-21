import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import type { CmsContext, CmsModelGroup } from "~/types/index.js";

type CreateModelGroup = CmsContext["cms"]["createGroup"];
type DeleteModelGroup = CmsContext["cms"]["deleteGroup"];

export class CmsInstaller implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "Cms";
    readonly dependsOn = [];
    private defaultGroup: CmsModelGroup | undefined;

    public constructor(
        private createModelGroup: CreateModelGroup,
        private deleteModelGroup: DeleteModelGroup
    ) {}

    async install(): Promise<void> {
        this.defaultGroup = await this.createModelGroup({
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: { name: "fas/star", type: "icon" }
        });
    }

    async uninstall(): Promise<void> {
        if (this.defaultGroup) {
            await this.deleteModelGroup(this.defaultGroup.id);
        }
    }
}
