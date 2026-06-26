import React, { useCallback } from "react";
import debounce from "lodash/debounce.js";
import type { CmsReferenceEntry } from "~/features/contentEntry/refTypes.js";
import { ScrollArea } from "@webiny/admin-ui";

interface EntryListProps {
    entries: CmsReferenceEntry[];
    children: (entry: CmsReferenceEntry, index: number) => React.ReactNode;
    loadMore: () => void;
}

export const EntryList = ({ entries, children, loadMore }: EntryListProps) => {
    const loadMoreOnScroll = useCallback(
        debounce(position => {
            if (position.top <= 0.9) {
                return;
            }
            loadMore();
        }, 500),
        [entries, loadMore]
    );

    return (
        <ScrollArea
            className={"max-h-[404px] w-full flex flex-col gap-md"}
            data-testid="advanced-ref-field-entries"
            onScroll={loadMoreOnScroll}
        >
            <div className={"flex flex-col gap-md"}>
                {entries.map((entry, index) => {
                    return <div key={`entry-${entry.id}`}>{children(entry, index)}</div>;
                })}
            </div>
        </ScrollArea>
    );
};
