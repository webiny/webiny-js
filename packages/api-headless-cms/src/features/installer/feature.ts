import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import { createFeature } from "@webiny/feature/api";
import type { CmsContext, CmsGroupCreateInput } from "~/types/index.js";
import { CmsInstaller } from "./CmsInstaller.js";

export const CmsInstallerFeature = createFeature<CmsContext["cms"]>({
    name: "CmsInstallerFeature",
    register(container, context: CmsContext["cms"]) {
        container.registerFactory(AppInstaller, () => {
            const createModelGroup = (data: CmsGroupCreateInput) => {
                return context.createGroup(data);
            };

            const deleteModelGroup = (id: string) => {
                return context.deleteGroup(id);
            };

            return new CmsInstaller(createModelGroup, deleteModelGroup);
        });
    }
});
