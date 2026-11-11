import React from "react";
import { cn } from "@webiny/admin-ui";
import { Loader } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { toolState } from "./toolState.js";
import type { ToolState } from "./toolState.js";

interface TraceEntry {
    name: string;
    state: ToolState;
    count: number;
}

/**
 * The calls a turn made, one entry per tool and outcome, in the order each first appeared. A tool
 * that ran four times is one entry, "× 4", and its failures are a second entry, since they are what
 * explains an answer that looks incomplete.
 *
 * Once the turn settles, a call that never returned is left out: that is a change proposed for
 * approval, or one the user rejected, and listing it under "Ran" would say it happened.
 */
const traceEntries = (turn: AiTurnViewModel): TraceEntry[] => {
    const entries: TraceEntry[] = [];

    turn.tools.forEach((name, index) => {
        const state = toolState(turn, index);
        if (turn.settled && state === "running") {
            return;
        }

        const entry = entries.find(item => item.name === name && item.state === state);
        if (entry) {
            entry.count++;
            return;
        }
        entries.push({ name, state, count: 1 });
    });

    return entries;
};

/**
 * The tools a turn used, as one line inside the answer, from the first call to the end.
 *
 * One line in one place, on purpose: it reads "Running" while the turn works, with a loader on each
 * call in flight, and "Ran" once it is done, so the tools never move or change style as it settles.
 */
export const ToolTrace = ({ turn }: { turn: AiTurnViewModel }) => {
    const entries = traceEntries(turn);

    if (entries.length === 0) {
        return null;
    }

    return (
        <div
            aria-live="polite"
            className="flex flex-wrap items-center gap-x-sm gap-y-xs text-sm text-neutral-strong"
        >
            <span>{turn.settled ? "Ran" : "Running"}</span>
            {entries.map(entry => (
                <span
                    key={`${entry.name}-${entry.state}`}
                    className="inline-flex items-center gap-xs"
                >
                    {entry.state === "running" ? <Loader size="xs" variant="subtle" /> : null}
                    <code
                        className={cn(
                            "font-mono text-sm",
                            entry.state === "failed" && "text-destructive-primary"
                        )}
                    >
                        {entry.count > 1 ? `${entry.name} × ${entry.count}` : entry.name}
                    </code>
                    {entry.state === "failed" ? (
                        <span className="text-destructive-primary">failed</span>
                    ) : null}
                </span>
            ))}
        </div>
    );
};
