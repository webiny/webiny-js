import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContext } from "../../../types";
import { migrateCMSPermissions } from "../../../migrateCMSPermissions";
import { isCmsContentPermission } from "./helpers";

const plugin: UpgradePlugin<CmsContext> = {
    name: "api-upgrade-cms-5.5.0",
    type: "api-upgrade",
    app: "headless-cms",
    version: "5.5.0",
    async apply(context) {
        console.log("Started CMS permissions migration.");
        // Migrate "Groups"
        try {
            const { security, tenancy, cms } = context;
            const tenant = tenancy.getCurrentTenant();
            // Check if there is any "SecurityGroup" that contains "cms" permissions.
            // @ts-ignore Because we don't need a package dependency; this is a one-off operation.
            const securityGroups = await security.groups.listGroups(tenant);
            const securityGroupsWithCmsPermission = securityGroups.filter(group =>
                group.permissions.some(isCmsContentPermission)
            );
            const exists = securityGroupsWithCmsPermission.length > 0;
            if (!exists) {
                console.log("No Security groups with CMS permissions exists.");
                return;
            }

            // For each such group, migrate permissions.
            for (let i = 0; i < securityGroupsWithCmsPermission.length; i++) {
                const securityGroup = securityGroupsWithCmsPermission[i];
                console.log(`Updating permission for group: ${securityGroup.slug}`);
                // Filter CMS content permissions.
                const CmsContentPermissions = securityGroup.permissions.filter(
                    isCmsContentPermission
                );
                const restPermissions = securityGroup.permissions.filter(
                    permission => !isCmsContentPermission(permission)
                );

                if (CmsContentPermissions.length === 0) {
                    console.log("Skipping...");
                    continue;
                }
                // Migrate CMS permissions
                const newCMSContentPermissions = await migrateCMSPermissions(
                    CmsContentPermissions,
                    cms.models.get
                );

                const newPermissions = [...restPermissions, ...newCMSContentPermissions];
                console.log(`Saving new permissions for group: ${securityGroup.slug}`);
                console.log("newPermissions: ", JSON.stringify(newPermissions, null, 2));
                // Save group
                // @ts-ignore
                await security.groups.updateGroup(tenant, securityGroup.slug, {
                    permissions: newPermissions
                });
            }

            // Indicate completion
            console.log("Finish CMS permissions migration for [Security groups].");
        } catch (e) {
            console.log(e);
            throw new WebinyError("[Security groups] CMS permissions migration failed!");
        }

        // Migrate "API Keys"
        try {
            const { security, cms } = context;
            // Check if there is any "APIKey" that contains "cms" permissions.
            // @ts-ignore
            const ApiKeys = await security.apiKeys.listApiKeys();
            const ApiKeysWithCmsPermission = ApiKeys.filter(key =>
                key.permissions.some(isCmsContentPermission)
            );
            const exists = ApiKeysWithCmsPermission.length > 0;
            if (!exists) {
                console.log("No API keys with CMS permissions exists.");
                return;
            }

            // For each such API key, migrate permissions.
            for (let i = 0; i < ApiKeysWithCmsPermission.length; i++) {
                const apiKey = ApiKeysWithCmsPermission[i];
                console.log(`Updating permission for API key: ${apiKey.name}`);
                // Filter CMS content permissions.
                const CmsContentPermissions = apiKey.permissions.filter(isCmsContentPermission);
                const restPermissions = apiKey.permissions.filter(
                    permission => !isCmsContentPermission(permission)
                );

                if (CmsContentPermissions.length === 0) {
                    console.log("Skipping...");
                    continue;
                }
                // Migrate CMS permissions.
                const newCMSContentPermissions = await migrateCMSPermissions(
                    CmsContentPermissions,
                    cms.models.get
                );

                const newPermissions = [...restPermissions, ...newCMSContentPermissions];
                console.log(`Saving new permissions for API key: ${apiKey.name}`);
                console.log("newPermissions: ", JSON.stringify(newPermissions, null, 2));
                // Save API key
                // @ts-ignore
                await security.apiKeys.updateApiKey(apiKey.id, {
                    name: apiKey.name,
                    description: apiKey.description,
                    permissions: newPermissions
                });
            }

            // Indicate completion
            console.log("Finish CMS permissions migration for API keys.");
        } catch (e) {
            console.log(e);
            throw new WebinyError("[API keys] CMS permissions migration failed!");
        }
    }
};

export default plugin;
