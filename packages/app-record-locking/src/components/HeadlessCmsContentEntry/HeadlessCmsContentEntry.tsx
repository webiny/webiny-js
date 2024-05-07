import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { ContentEntryGuard } from "./ContentEntryGuard";
import { ContentEntryLocker } from "./ContentEntryLocker";

const { ContentEntry } = ContentEntryEditorConfig;

export const HeadlessCmsContentEntry = ContentEntry.createDecorator(Original => {
    return function RecordLockingContentEntry(props) {
        const { entry } = ContentEntry.useContentEntry();
        /**
         * New entry does not have ID yet.
         */
        if (!entry?.id) {
            return <Original {...props} />;
        }
        /**
         * Continue with existing entry.
         */
        return (
            <ContentEntryGuard>
                <ContentEntryLocker>
                    <Original {...props} />
                </ContentEntryLocker>
            </ContentEntryGuard>
        );
    };
});
