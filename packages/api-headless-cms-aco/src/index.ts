import { ContextPlugin } from "@webiny/api";
import { CmsFolderPermissions } from "~/features/CmsFolderPermissions/CmsFolderPermissions.js";
import type { HcmsAcoContext } from "~/types.js";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";
import { ScheduleEntryFolderGuardFeature } from "~/features/ScheduleEntryFolderGuard/index.js";

export const createAcoHcmsContext = () => {
    const plugin = new ContextPlugin<HcmsAcoContext>(context => {
        SetLocationOnEntryRestoreFeature.register(context.container);
        ScheduleEntryFolderGuardFeature.register(context.container);
        context.container.register(CmsFolderPermissions);
    });

    plugin.name = "hcms-aco.createContext";

    return plugin;
};

export * from "./plugins/index.js";
