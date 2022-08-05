import { ContextPlugin } from "@webiny/handler";
import { SecurityPermission } from "@webiny/api-security/types";
import { WcpContext } from "~/types";
import { createWcp } from "~/createWcp";
import { filterOutCustomWbyAppsPermissions } from "~/utils";

export const createWcpContext = () => {
    return new ContextPlugin<WcpContext>(async context => {
        context.wcp = await createWcp();

        context.waitFor("security", () => {
            const previousGetPermissions = context.security.getPermissions;

            context.security.getPermissions = async function getPermissions(): Promise<
                SecurityPermission[]
            > {
                const permissions = await previousGetPermissions();

                const securitySystemRecord = await context.security
                    .getStorageOperations()
                    .getSystemData({ tenant: "root" });

                if (!securitySystemRecord?.createdOn) {
                    return permissions;
                }

                // If Advanced Access Control Layer (AACL) can be used, no need to do anything.
                if (context.wcp.canUseFeature("advancedAccessControlLayer")) {
                    return permissions;
                }

                // If Advanced Access Control Layer (AACL) cannot be used,
                // we omit all of Webiny apps-related custom permissions.
                return filterOutCustomWbyAppsPermissions(permissions);
            };
        });
    });
};
