import React from "react";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as SpinnerIcon } from "@webiny/icons/autorenew.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { toolState } from "./toolState.js";

/**
 * The tools a turn used, as one quiet line under the answer, from the first call to the end.
 *
 * One line in one place, on purpose. Progress used to show as chips above the answer that were
 * swapped for this line once the turn settled, so the same tools vanished from one spot and came
 * back in another, in another style. Now the line stays put: it reads "Running" while the turn
 * works, with a spinner on the call in flight, and "Ran" once it is done.
 *
 * A failed call stays visible, since it can explain an answer that looks incomplete.
 *
 * Once the turn settles, a call that never returned is left out: that is a change proposed for
 * approval, or one the user rejected, and listing it under "Ran" would say it happened.
 */
const traceCalls = (turn: AiTurnViewModel) =>
    turn.tools
        .map((name, index) => ({ name, index, state: toolState(turn, index) }))
        .filter(call => !turn.settled || call.state !== "running");

export const ToolTrace = ({ turn }: { turn: AiTurnViewModel }) => {
    const calls = traceCalls(turn);

    if (calls.length === 0) {
        return null;
    }

    return (
        <div className="mt-sm flex flex-wrap items-center gap-xxs first:mt-0">
            <Text size="sm" className="text-neutral-muted">
                {turn.settled ? "Ran" : "Running"}
            </Text>
            {calls.map(({ name, index, state }) => {
                const failed = state === "failed";

                return (
                    <Text
                        key={`${name}-${index}`}
                        size="sm"
                        // A failed call drops the grey fill, so the red name is what stands out.
                        className={cn(
                            "inline-flex items-center gap-xxs rounded-sm px-xs py-xxs font-mono",
                            failed
                                ? "text-destructive-primary"
                                : "bg-neutral-muted text-neutral-strong"
                        )}
                    >
                        {state === "running" ? (
                            <Icon
                                icon={<SpinnerIcon />}
                                size="xs"
                                label=""
                                color="inherit"
                                className="animate-spin"
                            />
                        ) : null}
                        {name}
                    </Text>
                );
            })}
        </div>
    );
};
