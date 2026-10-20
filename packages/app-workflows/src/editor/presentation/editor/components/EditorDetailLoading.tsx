import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const FLOW_CARDS = [0, 1, 2];

// The skeleton cards shown on the right while a model's workflow loads (design README 4).
export const EditorDetailLoading = () => {
    return (
        <div data-testid="editor-detail-loading" className="flex flex-col items-center gap-md p-lg">
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
    );
};
