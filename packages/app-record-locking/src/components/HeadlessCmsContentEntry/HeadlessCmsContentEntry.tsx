import React from "react";
import { useRouter } from "@webiny/app";
import { ContentEntryEditorConfig, ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ContentEntryGuard } from "./ContentEntryGuard.js";
import { ContentEntryLocker } from "./ContentEntryLocker.js";

const { ContentEntry, SingletonContentEntry } = ContentEntryEditorConfig;

const ContentEntryDecorator = ContentEntry.createDecorator(Original => {
    return function RecordLockingContentEntry() {
        const router = useRouter();
        const { entry, contentModel, loading } = ContentEntry.useContentEntry();
        const { navigateTo } = ContentEntryListConfig.ContentEntries.useContentEntriesList();
        /**
         * New entry does not have ID yet.
         */
        if (!entry?.id) {
            return <Original />;
        }
        /**
         * Continue with existing entry.
         */
        const props = { entry, model: contentModel };

        return (
            <ContentEntryGuard {...props} loading={loading}>
                <ContentEntryLocker
                    {...props}
                    onDisablePrompt={() => router.unblockTransition()}
                    onEntryUnlocked={navigateTo}
                >
                    <Original />
                </ContentEntryLocker>
            </ContentEntryGuard>
        );
    };
});

const SingletonContentEntryDecorator = SingletonContentEntry.createDecorator(Original => {
    return function RecordLockingSingletonContentEntry() {
        const router = useRouter();
        const { entry, contentModel, loading } = SingletonContentEntry.useSingletonContentEntry();

        const props = { entry, model: contentModel };

        return (
            <ContentEntryGuard {...props} loading={loading}>
                <ContentEntryLocker
                    {...props}
                    onDisablePrompt={() => router.unblockTransition()}
                    onEntryUnlocked={() => {
                        // There's nowhere to go, since singleton entry doesn't have a list view.
                    }}
                >
                    <Original />
                </ContentEntryLocker>
            </ContentEntryGuard>
        );
    };
});

export const HeadlessCmsContentEntry = () => {
    return (
        <>
            <ContentEntryDecorator />
            <SingletonContentEntryDecorator />
        </>
    );
};
