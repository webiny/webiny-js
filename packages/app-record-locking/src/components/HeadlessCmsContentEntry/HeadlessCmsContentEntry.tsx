import React from "react";
import { ContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry";
import { ContentEntryGuard } from "./ContentEntryGuard";
import { ContentEntryLocker } from "./ContentEntryLocker";
import { useContentEntry } from "@webiny/app-headless-cms";

export const HeadlessCmsContentEntry = ContentEntry.createDecorator(Original => {
    return function RecordLockingContentEntry(props) {
        const { entry } = useContentEntry();
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
