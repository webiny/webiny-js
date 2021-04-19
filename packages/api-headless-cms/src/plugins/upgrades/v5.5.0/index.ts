import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContext } from "../../../types";
import { migrateCMSPermissions } from "../../../migrateCMSPermissions";

const plugin: UpgradePlugin<CmsContext> = {
    name: "api-upgrade-cms",
    type: "api-upgrade",
    app: "headless-cms",
    version: "5.5.0-next.0", // TODO: change it to v5.5.0 after testing.
    async apply(context) {
        console.log("Started CMS permissions migration.");
        try {
            const { security } = context;
            const tenant = security.getTenant();
            // Check if there is any "SecurityGroup" that contains "cms" permissions.
            const securityGroups = await security.groups.listGroups(tenant);
            const securityGroupsWithCmsPermission = securityGroups.filter(group =>
                group.permissions.some(permission => permission.name.includes("cms."))
            );
            const exists = securityGroupsWithCmsPermission.length > 0;
            if (!exists) {
                console.log("No Security groups with CMS permissions exists.");
                return;
            }

            //  Get each such group
            for (let i = 0; i < securityGroupsWithCmsPermission.length; i++) {
                const securityGroup = securityGroupsWithCmsPermission[i];
                console.log(`Updating permission for group: ${securityGroup.slug}`);
                // Migrate CMS permissions
                const CMSContentPermissions = securityGroup.permissions.filter(
                    permission =>
                        permission.name.includes("cms.") &&
                        !permission.name.includes("cms.endpoint.")
                );
                const restPermissions = securityGroup.permissions.filter(
                    permission =>
                        !(
                            permission.name.includes("cms.") &&
                            !permission.name.includes("cms.endpoint.")
                        )
                );

                if (CMSContentPermissions.length === 0) {
                    console.log("Skipping...");
                    continue;
                }

                const newCMSContentPermissions = migrateCMSPermissions(CMSContentPermissions);

                const newPermissions = [...restPermissions, ...newCMSContentPermissions];
                console.log(`Saving new permissions for group: ${securityGroup.slug}`);
                console.log("newPermissions: ", JSON.stringify(newPermissions, null, 2));
                // Save group
                await security.groups.updateGroup(tenant, securityGroup.slug, {
                    permissions: newPermissions
                });
            }

            // Indicate completion
            console.log("Finish CMS permissions migration.");
        } catch (e) {
            console.log(e);
            throw new WebinyError("CMS permissions migration failed!");
        }
    }
};

export default plugin;
