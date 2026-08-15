import React from "react";
import { cn } from "@webiny/admin-ui";
import { STAGE_META } from "./stages.js";
import { STATUS_CONFIG, type DisplayStatus } from "./status.js";

/**
 * The nine-pip progress strip (W9.1 gap #2, spec §2). One 14×4px bar per stage, coloured by the stage's
 * status through the shared vocabulary — the scan target in the extractions list for "which jobs are
 * waiting on a decision". No admin-ui primitive covers this (SteppedProgress is a vertical, labelled
 * stepper), so it is built once here and read from `STATUS_CONFIG`.
 *
 * `statuses` is the run's nine display statuses in pipeline order (Discover … Promote).
 */
export const StagePips = ({
    statuses,
    className
}: {
    statuses: DisplayStatus[];
    className?: string;
}) => (
    <div
        className={cn("flex items-center gap-xxs", className)}
        role="img"
        aria-label="Pipeline progress"
    >
        {STAGE_META.map((meta, index) => {
            const status = statuses[index] ?? "not-started";
            return (
                <span
                    key={meta.stage}
                    className={cn("h-1 w-3.5 rounded-full", STATUS_CONFIG[status].pip)}
                    title={`${meta.number} · ${meta.label} — ${STATUS_CONFIG[status].label}`}
                />
            );
        })}
    </div>
);
