import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { upgradeCategories } from "~/upgrades/v5.15.0/category";
import { upgradeMenus } from "~/upgrades/v5.15.0/menu";
import { upgradePageElements } from "~/upgrades/v5.15.0/pageElement";

export default (): UpgradePlugin<PbContext> => {
    return {
        type: "api-upgrade",
        app: "page-builder",
        version: "5.15.0",
        apply: async context => {
            /**
             * Upgrade categories.
             */
            try {
                await upgradeCategories(context);
            } catch (ex) {
                console.log(ex.message);
            }
            /**
             * Upgrade menus.
             */
            try {
                await upgradeMenus(context);
            } catch (ex) {
                console.log(ex.message);
            }
            /**
             * Upgrade page elements.
             */
            try {
                await upgradePageElements(context);
            } catch (ex) {
                console.log(ex.message);
            }
        }
    };
};
