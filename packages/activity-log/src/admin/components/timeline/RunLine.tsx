import React from "react";
import { cn, Text } from "@webiny/admin-ui";
import type { DisclosedRun } from "~/admin/timeline/summariseItem.js";
import { TYPE } from "../typeScale.js";
import { formatClock } from "./formatTime.js";
import { PendingNote } from "./PendingNote.js";
import { SaveLine } from "./SaveLine.js";
import { SummaryLine } from "./SummaryLine.js";

/**
 * One run of the ledger: the time it happened, then what it did.
 *
 * The time column carries the nesting, which is what lets a run need no box and no indent. Four
 * levels — revision, row, run, save — were legible before only by nesting each inside the last, and
 * that is what made an expansion read as a form rather than as history.
 */
export const RunLine = ({ run }: { run: DisclosedRun }) => (
    <div
        className={
            "grid grid-cols-[52px_1fr] gap-xs border-b-sm border-dashed border-neutral-dimmed py-sm last:border-b-none"
        }
    >
        <Text className={cn(TYPE.meta, "pt-xxs pr-xxs text-right tabular-nums text-neutral-muted")}>
            {formatClock(run.saves[run.saves.length - 1]?.timestamp ?? "")}
        </Text>
        {/*
          One column for the whole run: the sentence, the placeholder and every save's fields all
          begin at the same edge. They used to find it separately — a grid on the sentence, a
          hand-written pad on the saves — and measured eight pixels apart in the browser.
        */}
        <div className={"min-w-0 pl-xs"}>
            {run.summary ? <SummaryLine summary={run.summary} /> : null}
            {run.pending ? <PendingNote /> : null}
            {/*
              The gap above the saves separates them from what the run said about itself, so it
              belongs only where the run said something. A row that maps onto a single run states
              its sentence in the header and leaves this one silent — and there the gap had nothing
              to separate, so it pushed the first chip four pixels below the clock beside it.
            */}
            <div className={cn("flex flex-col gap-xs", (run.summary || run.pending) && "mt-xs")}>
                {run.saves.map(save => (
                    <SaveLine key={save.id} save={save} showTime={run.showSaveTimes} />
                ))}
            </div>
        </div>
    </div>
);
