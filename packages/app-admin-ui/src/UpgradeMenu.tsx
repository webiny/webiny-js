import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";

const PRICING_URL = "https://www.webiny.com/pricing";

const { Menu } = AdminConfig;

/**
 * "Upgrade" in the navigation footer, on the Free plan. The admin reads the license through feature
 * flags, and multi-tenancy is the flag a Free project never has.
 */
export const UpgradeMenu = () => {
    const isFreePlan = !useFeatureFlags().isEnabled("multiTenancy");

    if (!isFreePlan) {
        return null;
    }

    return (
        <AdminConfig>
            <Menu.Footer
                name={"upgrade"}
                pin={"end"}
                element={
                    <Menu.Item
                        text={"Upgrade"}
                        variant={"accent"}
                        icon={<Menu.Item.Icon element={<BoltIcon />} label={"Upgrade"} />}
                        onClick={() => window.open(PRICING_URL, "_blank", "noopener")}
                    />
                }
            />
        </AdminConfig>
    );
};
