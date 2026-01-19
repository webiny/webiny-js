import React, { useCallback } from "react";
import debounce from "lodash/debounce.js";
import type { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { ScrollArea } from "@webiny/admin-ui";

interface EntriesProps {
    entries: CmsReferenceContentEntry[];
    children: (entry: CmsReferenceContentEntry, index: number) => React.ReactNode;
    loadMore: () => void;
}

export const Entries = (props: EntriesProps) => {
    const { entries, children, loadMore } = props;

    const loadMoreOnScroll = useCallback(
        debounce(position => {
            console.log("pos", position);
            if (position.top <= 0.9) {
                return;
            }
            loadMore();
        }, 500),
        [entries, loadMore]
    );

    return (
        <ScrollArea
            className={"h-[416px] w-full overflow-x-hidden overflow-y-hidden flex flex-col gap-md"}
            data-testid="advanced-ref-field-entries"
            onScrollCapture={loadMoreOnScroll}
        >
            <div className={"flex flex-col gap-md"}>
                {entries.map((entry, index) => {
                    return <div key={`entry-${entry.id}`}>{children(entry, index)}</div>;
                })}
            </div>
        </ScrollArea>
    );
};
