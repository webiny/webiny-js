import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const PANEL_ROWS = [0, 1, 2, 3, 4, 5];
const FLOW_CARDS = [0, 1, 2];

// The static skeleton of the model panel and the flow (design README 4, loading state).
export const EditorLoading = () => {
    return (
        <div data-testid="editor-loading" className="flex h-main-content">
            <div className="flex flex-col gap-md p-md w-1/4">
                {PANEL_ROWS.map(row => (
                    <Skeleton key={row} type="text" />
                ))}
            </div>
            <div className="flex flex-col grow gap-md p-lg">
                {FLOW_CARDS.map(card => (
                    <div key={card} data-testid="editor-skeleton-card" className="w-full h-xxl">
                        <Skeleton type="area" />
                    </div>
                ))}
            </div>
        </div>
    );
};
