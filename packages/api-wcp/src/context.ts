import { ContextPlugin } from "@webiny/handler";
import { SecurityPermission } from "@webiny/api-security/types";
import { WcpContext } from "~/types";
import { createWcp } from "~/createWcp";
import { filterOutCustomWbyAppsPermissions } from "~/utils";

export const createWcpContext = () => {
    return new ContextPlugin<WcpContext>(async context => {
        context.wcp = await createWcp();

        context.waitFor("security", () => {
            const previousGetPermissions = context.security.getPermissions.bind(context.security);

            context.security.getPermissions = async function getPermissions(): Promise<
                SecurityPermission[]
            > {
                // For starters, we load permissions as usual.
                const permissions = await previousGetPermissions();

                // Now we start checking whether we want to return all permissions, or we
                // need to omit the custom ones because of the one of the following reasons.

                // 1. Are we dealing with an old Webiny project?
                const securitySystemRecord = await context.security
                    .getStorageOperations()
                    .getSystemData({ tenant: "root" });

                // Older versions of Webiny do not have the `createdOn` value stored. So,
                // if missing, we don't want to make any changes to the existing behavior.
                if (!securitySystemRecord || !securitySystemRecord.createdOn) {
                    return permissions;
                }

                // 2. If Advanced Access Control Layer (AACL) can be used, again, no need to do anything.
                if (context.wcp.canUseFeature("advancedAccessControlLayer")) {
                    return permissions;
                }

                // 3. If Advanced Access Control Layer (AACL) cannot be used,
                // we omit all of the Webiny apps-related custom permissions.
                return filterOutCustomWbyAppsPermissions(permissions);
            };
        });
    });
};
