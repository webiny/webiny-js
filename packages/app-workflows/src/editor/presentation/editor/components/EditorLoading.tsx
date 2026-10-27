import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const PANEL_ROWS = [0, 1, 2, 3, 4, 5];
const FLOW_CARDS = [0, 1, 2];

// The static skeleton of the model panel and the flow (design README 4, loading state).
export const EditorLoading = () => {
    return (
        <div data-testid="editor-loading" className="grid grid-cols-[272px_1fr] h-main-content">
            <div className="flex flex-col gap-md p-md border-r border-neutral-dimmed">
                {PANEL_ROWS.map(row => (
                    <Skeleton key={row} type="text" />
                ))}
            </div>
            <div className="flex flex-col items-center gap-md p-lg">
                {FLOW_CARDS.map(card => (
                    <div
                        key={card}
                        data-testid="editor-skeleton-card"
                        className="w-full max-w-[680px] h-xxl"
                    >
                        <Skeleton type="area" />
                    </div>
                ))}
            </div>
        </div>
    );
};
