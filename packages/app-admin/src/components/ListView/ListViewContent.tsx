import React, { useMemo } from "react";
import { Scrollbar } from "@webiny/admin-ui";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { useListView } from "./context.js";

export interface ListViewContentProps {
    loadMoreThreshold?: number;
    loadMoreDebounceMs?: number;
    empty?: React.ReactNode;
    searchEmpty?: React.ReactNode;
    children: React.ReactNode;
}

const ListViewContent = observer(
    ({
        loadMoreThreshold = 0.8,
        loadMoreDebounceMs = 200,
        empty,
        searchEmpty,
        children
    }: ListViewContentProps) => {
        const { list, actions } = useListView();

        const onScrollFrame = useMemo(
            () =>
                debounce(async (scrollFrame: { top: number }) => {
                    if (scrollFrame.top > loadMoreThreshold) {
                        await actions.loadMore();
                    }
                }, loadMoreDebounceMs),
            [loadMoreThreshold, loadMoreDebounceMs, actions]
        );

        if (list.empty && empty) {
            return (
                <Scrollbar data-testid="default-data-list">
                    {list.emptyWithFilters && searchEmpty ? searchEmpty : empty}
                </Scrollbar>
            );
        }

        return (
            <Scrollbar
                data-testid="default-data-list"
                onScrollFrame={scrollFrame => onScrollFrame(scrollFrame)}
            >
                {children}
            </Scrollbar>
        );
    }
);

export { ListViewContent };
