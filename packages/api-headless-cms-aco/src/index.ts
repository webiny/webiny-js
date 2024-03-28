import { ContextPlugin } from "@webiny/api";
import { createEntryHooks } from "~/hooks/entry";
import { HcmsAcoContext } from "~/types";

export const createAcoHcmsContext = () => {
    const plugin = new ContextPlugin<HcmsAcoContext>(async context => {
        if (!context.aco) {
            console.log(`There is no ACO initialized so we will not initialize the HCMS ACO.`);
            return;
        }
        createEntryHooks(context);
    });

    plugin.name = "hcms-aco.createContext";

    return plugin;
};
