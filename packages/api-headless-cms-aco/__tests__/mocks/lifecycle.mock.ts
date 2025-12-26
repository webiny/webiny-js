import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    EntryBeforeRestoreFromBinHandler,
    EntryAfterRestoreFromBinHandler
} from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { ContextPlugin } from "@webiny/api";

export const tracker = new LifecycleEventTracker();

class TrackEntryBeforeRestoreHandler implements EntryBeforeRestoreFromBinHandler.Interface {
    async handle(event: EntryBeforeRestoreFromBinHandler.Event): Promise<void> {
        tracker.track("entry:beforeRestore", event.payload);
    }
}

class TrackEntryAfterRestoreHandler implements EntryAfterRestoreFromBinHandler.Interface {
    async handle(event: EntryAfterRestoreFromBinHandler.Event): Promise<void> {
        tracker.track("entry:afterRestore", event.payload);
    }
}

export const assignCmsLifecycleEvents = () => {
    return new ContextPlugin(context => {
        context.container.registerFactory(
            EntryBeforeRestoreFromBinHandler,
            () => new TrackEntryBeforeRestoreHandler()
        );
        context.container.registerFactory(
            EntryAfterRestoreFromBinHandler,
            () => new TrackEntryAfterRestoreHandler()
        );
    });
};
