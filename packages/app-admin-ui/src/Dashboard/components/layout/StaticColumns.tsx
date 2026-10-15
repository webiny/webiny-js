import React from "react";
import { collapseColumns } from "./collapseColumns.js";
import { DASHBOARD_MAX_WIDTH } from "./layoutConstants.js";

interface StaticColumnsProps {
    columns: string[][];
    // How many columns fit on screen; fewer than `columns.length` folds them together.
    visibleCount: number;
    slots: Map<string, React.ReactElement>;
}

// The everyday dashboard: widgets laid out in their columns, nothing to drag.
export const StaticColumns = ({ columns, visibleCount, slots }: StaticColumnsProps) => {
    const collapsed = collapseColumns(columns, visibleCount);
    return (
        <div className={"flex gap-lg"} style={{ maxWidth: DASHBOARD_MAX_WIDTH }}>
            {collapsed.map((names, index) => (
                <div key={index} className={"flex flex-1 flex-col gap-lg"}>
                    {names.map(name => (
                        <React.Fragment key={name}>{slots.get(name)}</React.Fragment>
                    ))}
                </div>
            ))}
        </div>
    );
};
