import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = [0, 1, 2, 3, 4];

// Five skeleton rows while the list loads (R322, frame 09).
export const ExclusionsLoading = () => {
    return (
        <div data-testid="exclusions-loading" className="flex flex-col gap-md">
            {ROWS.map(row => (
                <div key={row} data-testid="exclusions-loading-row">
                    <Skeleton type="text" />
                </div>
            ))}
        </div>
    );
};
