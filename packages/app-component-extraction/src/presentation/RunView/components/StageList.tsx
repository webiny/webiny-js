import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, ProgressBar, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { STAGES, STAGE_LABELS } from "~/constants.js";
import { stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../abstractions.js";

const statusVariant = (status: string | undefined): React.ComponentProps<typeof Tag>["variant"] => {
    switch (status) {
        case "done":
            return "success";
        case "starting":
        case "running":
            return "accent";
        case "failed":
            return "destructive";
        case "stale":
            return "warning";
        default:
            return "neutral-muted";
    }
};

interface Props {
    presenter: RunViewPresenter.Interface;
}

export const StageList = createReactiveComponent(function StageList({ presenter }: Props) {
    const { vm } = presenter;
    const run = vm.run;
    if (!run) {
        return null;
    }

    // Only one stage runs at a time; while one is running — or one the operator just triggered is
    // starting — offer no other run buttons (except re-running the running one, to recover a stuck stage).
    const anyRunning =
        vm.actionStage !== null ||
        STAGES.some(stage => stageEntry(run, stage)?.status === "running");

    return (
        <div className="flex flex-col">
            {STAGES.map((stage, index) => {
                const entry = stageEntry(run, stage);
                const status = entry?.status ?? "pending";
                const selected = vm.selectedStage === stage;
                // The stage the operator just triggered, before the backend has marked it running — shown
                // as "starting" so the click has an immediate effect in the sidebar.
                const busy = vm.actionStage === stage;
                const displayStatus = busy ? "starting" : status;
                const progress = status === "running" ? vm.progressByStage[stage] : undefined;

                // A stage can run when its predecessor is done (or it's the first). A pending stage runs
                // forward ("Run"); an already-run stage re-runs ("Re-run") — which resumes a stuck stage
                // from its checkpoint, or re-does a completed one (marking downstream stale).
                const previous = index > 0 ? STAGES[index - 1] : null;
                const predecessorDone = !previous || stageEntry(run, previous)?.status === "done";
                const canRun = busy || status === "running" || (predecessorDone && !anyRunning);
                const label = status === "pending" ? "Run" : "Re-run";

                return (
                    <div key={stage}>
                        <div
                            className={`flex items-center gap-sm px-md py-sm cursor-pointer border-l-2 ${
                                selected
                                    ? "border-primary-default bg-neutral-light"
                                    : "border-transparent hover:bg-neutral-light"
                            }`}
                            onClick={() => presenter.selectStage(stage)}
                        >
                            <div className="flex-1 min-w-0">
                                <Text className="font-medium">{STAGE_LABELS[stage]}</Text>
                            </div>
                            <Tag variant={statusVariant(displayStatus)} content={displayStatus} />
                            {canRun ? (
                                <Button
                                    variant={status === "pending" ? "primary" : "secondary"}
                                    size="sm"
                                    icon={<PlayIcon />}
                                    text={busy ? "Starting..." : label}
                                    disabled={busy}
                                    onClick={event => {
                                        event.stopPropagation();
                                        void presenter.runStage(stage);
                                    }}
                                />
                            ) : null}
                        </div>
                        {progress ? (
                            <div className="px-md pb-sm flex flex-col gap-xs">
                                {progress.total > 0 ? (
                                    <ProgressBar
                                        value={progress.current}
                                        max={progress.total}
                                        valuePosition="end"
                                    />
                                ) : null}
                                <Text size="sm" className="text-neutral-strong">
                                    {progress.message}
                                </Text>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
});
