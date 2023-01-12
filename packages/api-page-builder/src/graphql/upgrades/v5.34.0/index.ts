import { UpgradePlugin } from "@webiny/api-upgrade";
import WebinyError from "@webiny/error";
import { PbContext } from "~/graphql/types";
import { migrateBlocks } from "./migrateBlocks";

export const createUpgrade = (): UpgradePlugin<PbContext> => {
    return {
        type: "api-upgrade",
        version: "5.34.0",
        app: "page-builder",
        apply: async context => {
            const { security, tenancy } = context;

            /**
             * We need to be able to access all data.
             */
            security.disableAuthorization();

            const initialTenant = tenancy.getCurrentTenant();

            try {
                const tenants = await tenancy.listTenants();
                for (const tenant of tenants) {
                    tenancy.setCurrentTenant(tenant);

                    await migrateBlocks(tenant, context);
                }
            } catch (e) {
                console.log(
                    `Upgrade error: ${JSON.stringify({
                        message: e.message,
                        code: e.code,
                        data: e.data
                    })}`
                );
                throw new WebinyError(
                    `Could not finish the 5.34.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        message: e.message,
                        code: e.code,
                        data: e.data
                    }
                );
            } finally {
                /**
                 * Always enable the security after all the code runs.
                 */
                security.enableAuthorization();
                tenancy.setCurrentTenant(initialTenant);
            }
        }
    };
};
