import React from "react";
import { cn } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { toolState, type ToolState } from "./toolState.js";

const tone = (state: ToolState) => {
    if (state === "failed") {
        return "text-destructive-primary";
    }

    // Struck through, so a call the user turned down does not sit under "Ran" as if it had run.
    if (state === "rejected") {
        return "text-neutral-muted line-through";
    }

    return "text-neutral-muted";
};

/**
 * The tools a settled turn called, as one quiet line under its answer. A call that failed keeps its
 * colour, since the model recovering from an error is worth seeing even after the fact.
 */
export const ToolTrace = ({ turn }: { turn: AiTurnViewModel }) => {
    if (turn.tools.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-xs pt-sm">
            <Text size="sm" className="text-neutral-muted">
                Ran
            </Text>
            {turn.tools.map((name, index) => (
                <span
                    key={`${name}-${index}`}
                    className={cn(
                        "rounded-sm border border-neutral-dimmed bg-neutral-subtle px-xs font-mono text-sm",
                        tone(toolState(turn, index))
                    )}
                >
                    {name}
                </span>
            ))}
        </div>
    );
};
