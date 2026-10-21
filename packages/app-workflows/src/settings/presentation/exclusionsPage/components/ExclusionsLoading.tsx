import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = [0, 1, 2, 3, 4];

// Five skeleton rows while the list loads (R322, frame 09).
export const ExclusionsLoading = () => {
    return (
        <div
            data-testid="exclusions-loading"
            className="flex flex-col rounded-md border-sm border-solid border-neutral-dimmed bg-neutral-base"
        >
            {ROWS.map(row => (
                <div
                    key={row}
                    data-testid="exclusions-loading-row"
                    className="p-md border-b-sm border-solid border-neutral-dimmed"
                >
                    <Skeleton type="text" />
                </div>
            ))}
        </div>
    );
};
