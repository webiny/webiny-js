import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, ProgressBar, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { STAGES, STAGE_LABELS } from "~/constants.js";
import { nextRunnableStage, stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../abstractions.js";

const statusVariant = (status: string | undefined): React.ComponentProps<typeof Tag>["variant"] => {
    switch (status) {
        case "done":
            return "success";
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

    const runnable = nextRunnableStage(run);

    return (
        <div className="flex flex-col">
            {STAGES.map(stage => {
                const entry = stageEntry(run, stage);
                const status = entry?.status ?? "pending";
                const selected = vm.selectedStage === stage;
                const isRunnable = runnable === stage;
                const busy = vm.actionStage === stage;
                const progress = status === "running" ? vm.progressByStage[stage] : undefined;

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
                            <Tag variant={statusVariant(status)} content={status} />
                            {isRunnable ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<PlayIcon />}
                                    text={busy ? "Starting..." : "Run"}
                                    disabled={busy}
                                    onClick={event => {
                                        event.stopPropagation();
                                        void presenter.runStage(stage);
                                    }}
                                />
                            ) : status === "running" ? (
                                // A running stage whose task died stays stuck here; re-running resumes it
                                // from its checkpoint.
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<PlayIcon />}
                                    text={busy ? "Starting..." : "Re-run"}
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
