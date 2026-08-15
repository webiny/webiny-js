import React from "react";
import { Text, cn } from "@webiny/admin-ui";
import type { Stage } from "~/constants.js";
import { STAGE_META } from "./stages.js";
import { StatusDot, StageKindChip, PipelineLegend } from "./StatusIndicator.js";
import type { DisplayStatus } from "./status.js";

/**
 * The stage rail (W9.1 gap #3, spec §4). A sticky 262px pipeline navigator: nine rows, each a status dot,
 * the stage name and the "AI" chip on model-backed stages, with the selected row highlighted. Rows are
 * always clickable — a not-yet-reached stage still selects (the screen shows a "not reached" panel). This
 * replaces the `SteppedProgress` usage in the run view. No admin-ui primitive fits, so it is built once.
 */

export interface StageRailRow {
    stage: Stage;
    status: DisplayStatus;
}

interface StageRailProps {
    rows: StageRailRow[];
    selected?: Stage | null;
    onSelect: (stage: Stage) => void;
    /** Footer content under the legend — e.g. a "Back to job" ghost button on stage screens. */
    footer?: React.ReactNode;
    className?: string;
}

export const StageRail = ({ rows, selected, onSelect, footer, className }: StageRailProps) => {
    const statusByStage = new Map(rows.map(row => [row.stage, row.status]));
    const completed = rows.filter(row => row.status === "complete").length;

    return (
        <div
            className={cn(
                "flex flex-col gap-xs rounded-lg border border-neutral-dimmed bg-neutral-base p-sm-plus",
                className
            )}
        >
            <div className="flex items-center justify-between px-xs">
                <Text
                    size="sm"
                    className="font-semibold uppercase tracking-wide text-neutral-strong"
                >
                    Pipeline
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    {completed}/{rows.length}
                </Text>
            </div>

            <div className="flex flex-col gap-xxs">
                {STAGE_META.map(meta => {
                    const status = statusByStage.get(meta.stage) ?? "not-started";
                    const isSelected = selected === meta.stage;
                    return (
                        <button
                            key={meta.stage}
                            type="button"
                            onClick={() => onSelect(meta.stage)}
                            className={cn(
                                "flex items-center gap-sm rounded-sm border-l-2 border-transparent py-xs pl-xs pr-sm text-left transition-colors",
                                "cursor-pointer hover:bg-neutral-light",
                                isSelected && "border-primary bg-neutral-light"
                            )}
                        >
                            <StatusDot status={status} stageNumber={meta.number} />
                            <Text
                                size="sm"
                                className={cn(
                                    "flex-1 truncate",
                                    isSelected ? "font-semibold" : "font-regular"
                                )}
                            >
                                {meta.label}
                            </Text>
                            <StageKindChip kind={meta.kind} />
                        </button>
                    );
                })}
            </div>

            <div className="mt-xs border-t border-neutral-dimmed pt-sm">
                <PipelineLegend />
                {footer ? <div className="mt-sm">{footer}</div> : null}
            </div>
        </div>
    );
};
