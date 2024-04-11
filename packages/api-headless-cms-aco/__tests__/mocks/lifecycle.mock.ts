import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { HcmsAcoContext } from "~/types";

export const tracker = new LifecycleEventTracker();

export const assignCmsLifecycleEvents = () => {
    return new ContextPlugin<HcmsAcoContext>(async context => {
        context.cms.onEntryBeforeRestoreFromBin.subscribe(async params => {
            tracker.track("entry:beforeRestore", params);
        });
        context.cms.onEntryBeforeRestoreFromBin.subscribe(async params => {
            tracker.track("entry:afterRestore", params);
        });
    });
};
