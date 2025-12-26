import { ContextPlugin } from "@webiny/api";
import type { HcmsAcoContext } from "~/types.js";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";

export const createAcoHcmsContext = () => {
    const plugin = new ContextPlugin<HcmsAcoContext>(context => {
        SetLocationOnEntryRestoreFeature.register(context.container);
    });

    plugin.name = "hcms-aco.createContext";

    return plugin;
};

export * from "./plugins/index.js";
