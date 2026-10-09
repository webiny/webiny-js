import React from "react";
import { Button, Text } from "@webiny/admin-ui";
import type { Stage } from "~/constants.js";
import type { RunDto } from "~/shared/types.js";
import { stageMeta } from "~/presentation/shared/stages.js";
import { finishedSummary, WAITING_SENTENCES } from "~/shared/waiting.js";

/**
 * The state the user sees most: a stage has finished and the run waits for them to start the next
 * (waiting-screens-plan.md). Says what the stage produced and what the next one will do, with its button.
 */
interface Props {
    stage: Stage;
    next: Stage;
    counts: RunDto["counts"];
    busy: boolean;
    onRun: () => void;
}

export const NextStep = ({ stage, next, counts, busy, onRun }: Props) => {
    const finished = finishedSummary(stage, counts);
    const meta = stageMeta(next);
    return (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-md border border-neutral-dimmed bg-neutral-subtle px-md py-sm">
            <div className="flex min-w-0 flex-col gap-xxs">
                <Text size="sm" className="font-medium">
                    {stageMeta(stage).label} finished.{finished ? ` ${finished}` : ""} Review it,
                    then continue.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    Next, {meta.number} · {meta.label}: {WAITING_SENTENCES[next]}
                </Text>
            </div>
            <Button
                size="sm"
                text={`Run ${meta.number} · ${meta.label}`}
                disabled={busy}
                onClick={onRun}
            />
        </div>
    );
};
