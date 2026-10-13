import React from "react";
import { cn } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { toolState } from "./toolState.js";

/**
 * The tools a finished turn ran, as one quiet line under the answer.
 *
 * While the turn runs, `ToolChip`s above the answer show progress. Once the answer is in, the work
 * matters less than the result, so it shrinks to this. A failed call stays visible here, since it
 * can explain an answer that looks incomplete.
 *
 * A call that never returned is left out: that is a change proposed for approval, or one the user
 * rejected, and listing it under "Ran" would say it happened.
 */
export const ToolTrace = ({ turn }: { turn: AiTurnViewModel }) => {
    const ran = turn.tools
        .map((name, index) => ({ name, index, state: toolState(turn, index) }))
        .filter(call => call.state !== "running");

    if (ran.length === 0) {
        return null;
    }

    return (
        <div className="mt-sm flex flex-wrap items-center gap-xs">
            <Text size="sm" className="text-neutral-muted">
                Ran
            </Text>
            {ran.map(({ name, index, state }) => {
                const failed = state === "failed";

                return (
                    <Text
                        key={`${name}-${index}`}
                        size="sm"
                        className={cn(
                            "rounded-sm border px-xs font-mono",
                            failed
                                ? "border-destructive-subtle text-destructive-primary"
                                : "border-neutral-dimmed text-neutral-muted"
                        )}
                    >
                        {name}
                    </Text>
                );
            })}
        </div>
    );
};
