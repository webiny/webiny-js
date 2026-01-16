import React, { useCallback } from "react";
import debounce from "lodash/debounce.js";
import type { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { Scrollbar } from "@webiny/admin-ui";
import type { positionValues as PositionValues } from "react-custom-scrollbars";

interface EntriesProps {
    entries: CmsReferenceContentEntry[];
    children: (entry: CmsReferenceContentEntry, index: number) => React.ReactNode;
    loadMore: () => void;
}

export const Entries = (props: EntriesProps) => {
    const { entries, children, loadMore } = props;

    const loadMoreOnScroll = useCallback(
        debounce((position: PositionValues) => {
            if (position.top <= 0.9) {
                return;
            }
            loadMore();
        }, 500),
        [entries, loadMore]
    );

    return (
        <div style={{ height: "260px" }} className={"w-full overflow-x-hidden overflow-y-hidden"}>
            <Scrollbar data-testid="advanced-ref-field-entries" onScrollFrame={loadMoreOnScroll}>
                {entries.map((entry, index) => {
                    return (
                        <div className={"mb-sm w-full"} key={`entry-${entry.id}`}>
                            {children(entry, index)}
                        </div>
                    );
                })}
            </Scrollbar>
        </div>
    );
};
