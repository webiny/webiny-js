import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    EntryAfterRestoreFromBinEventHandler,
    EntryBeforeRestoreFromBinEventHandler
} from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { ContextPlugin } from "@webiny/api";

export const tracker = new LifecycleEventTracker();

class TrackEntryBeforeRestoreHandler implements EntryBeforeRestoreFromBinEventHandler.Interface {
    async handle(event: EntryBeforeRestoreFromBinEventHandler.Event): Promise<void> {
        tracker.track("entry:beforeRestore", event.payload);
    }
}

class TrackEntryAfterRestoreHandler implements EntryAfterRestoreFromBinEventHandler.Interface {
    async handle(event: EntryAfterRestoreFromBinEventHandler.Event): Promise<void> {
        tracker.track("entry:afterRestore", event.payload);
    }
}

export const assignCmsLifecycleEvents = () => {
    return new ContextPlugin(context => {
        context.container.registerFactory(
            EntryBeforeRestoreFromBinEventHandler,
            () => new TrackEntryBeforeRestoreHandler()
        );
        context.container.registerFactory(
            EntryAfterRestoreFromBinEventHandler,
            () => new TrackEntryAfterRestoreHandler()
        );
    });
};
