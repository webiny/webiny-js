import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    EntryAfterRestoreFromBinEventHandler,
    EntryBeforeRestoreFromBinEventHandler
} from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import type { Container } from "@webiny/di";

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
    return (container: Container) => {
        container.registerFactory(
            EntryBeforeRestoreFromBinEventHandler,
            () => new TrackEntryBeforeRestoreHandler()
        );
        container.registerFactory(
            EntryAfterRestoreFromBinEventHandler,
            () => new TrackEntryAfterRestoreHandler()
        );
    };
};
