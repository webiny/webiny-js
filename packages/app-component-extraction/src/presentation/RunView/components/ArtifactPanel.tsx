import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Scrollbar, Text, TimeAgo } from "@webiny/admin-ui";
import { STAGES, type Stage } from "~/constants.js";
import { degradedSummary } from "~/shared/waiting.js";
import { ActivityLog } from "./ActivityLog.js";
import { NextStep } from "./NextStep.js";
import { StageWaiting } from "./StageWaiting.js";
import { stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../abstractions.js";
import type { StageLogItem } from "~/shared/types.js";
import { DiscoverView } from "./stages/DiscoverView.js";
import { CaptureView } from "./stages/CaptureView.js";
import { SegmentView } from "./stages/SegmentView.js";
import { ClusterView } from "./stages/ClusterView.js";
import { ClassifyView } from "./stages/ClassifyView.js";
import { PlanView } from "./stages/PlanView.js";
import { GenerateView } from "./stages/GenerateView.js";
import { AssembleView } from "./stages/AssembleView.js";
import { PromoteView } from "./stages/PromoteView.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

/** The specialized visibility view for a stage, or null for stages that stay on the record/log panel. */
const StageView = ({
    stage,
    presenter
}: {
    stage: Stage;
    presenter: RunViewPresenter.Interface;
}) => {
    switch (stage) {
        case "discover":
            return <DiscoverView presenter={presenter} />;
        case "capture":
            return <CaptureView presenter={presenter} />;
        case "segment":
            return <SegmentView presenter={presenter} />;
        case "cluster":
            return <ClusterView presenter={presenter} />;
        case "classify":
            return <ClassifyView presenter={presenter} />;
        case "plan":
            return <PlanView presenter={presenter} />;
        case "generate":
            return <GenerateView presenter={presenter} />;
        case "assemble":
            return <AssembleView presenter={presenter} />;
        case "promote":
            return <PromoteView presenter={presenter} />;
        default:
            return null;
    }
};

const VIEW_STAGES = new Set<Stage>([
    "discover",
    "capture",
    "segment",
    "cluster",
    "classify",
    "plan",
    "generate",
    "assemble",
    "promote"
]);

const LogLine = ({ item }: { item: StageLogItem }) => {
    const errored = item.type === "error";
    return (
        <div className="flex gap-sm py-xs border-b border-neutral-dimmed last:border-b-0">
            <Text
                size="sm"
                className={`flex-1 min-w-0 break-words ${errored ? "text-destructive-default" : ""}`}
            >
                {item.message}
            </Text>
            <Text size="sm" className="text-neutral-strong whitespace-nowrap shrink-0">
                <TimeAgo datetime={item.createdOn} />
            </Text>
        </div>
    );
};

/**
 * The selected stage's activity: its full task log trail (read from the Background Tasks store, so the
 * per-item log is here without leaving for CloudWatch), followed by the raw stage record for inspection.
 */
export const ArtifactPanel = createReactiveComponent(function ArtifactPanel({ presenter }: Props) {
    const { vm } = presenter;
    const run = vm.run;
    const stage = vm.selectedStage as Stage | null;

    if (!run || !stage) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Text className="text-neutral-strong">Select a stage to inspect its output.</Text>
            </div>
        );
    }

    const entry = stageEntry(run, stage);
    const logsForStage = vm.logsStage === stage ? vm.logs : [];

    // Once a view-stage has output, show its visibility view; before then (pending/running) keep the
    // activity log + record so the run is legible while it works. Promote is the exception — its gate
    // (W8.6) opens as soon as Generate has produced components to select, before Promote itself runs.
    const hasOutput = entry?.status === "done" || entry?.status === "stale";
    const generateEntry = stageEntry(run, "generate");
    const generateDone = generateEntry?.status === "done" || generateEntry?.status === "stale";
    const showView = VIEW_STAGES.has(stage) && (hasOutput || (stage === "promote" && generateDone));

    const failed = entry?.status === "failed";
    const degraded =
        hasOutput && vm.artifactStage === stage ? degradedSummary(stage, vm.artifact) : null;
    // The step between stages: this stage is done, the next has not run, and nothing is running.
    const next = STAGES[STAGES.indexOf(stage) + 1] as Stage | undefined;
    const nextEntry = next ? stageEntry(run, next) : undefined;
    const idle = !run.stages.some(candidate => candidate.status === "running");
    const showNext =
        entry?.status === "done" && next && (!nextEntry || nextEntry.status === "pending") && idle;

    const log = (
        <ActivityLog
            items={logsForStage}
            loading={vm.logsLoading}
            openByDefault={failed || Boolean(degraded)}
            renderLine={(item, index) => <LogLine key={index} item={item} />}
        />
    );

    return (
        <div className="flex flex-col h-full min-h-0">
            {entry?.error ? (
                <div className="px-md py-sm border-b border-destructive-dimmed bg-destructive-subtle">
                    <Text size="sm" className="text-destructive-default">
                        {entry.error}
                    </Text>
                </div>
            ) : null}
            {showNext && next ? (
                <div className="px-md pt-sm">
                    <NextStep
                        stage={stage}
                        next={next}
                        counts={run.counts}
                        busy={vm.actionStage !== null}
                        onRun={() => void presenter.runStage(next)}
                    />
                </div>
            ) : null}
            {degraded ? (
                <div className="px-md pt-sm">
                    <Alert type="warning">
                        {degraded} The reasons are in the activity log below.
                    </Alert>
                </div>
            ) : null}
            {showView ? (
                <>
                    <div className="relative min-h-0 flex-1 overflow-hidden">
                        <StageView stage={stage} presenter={presenter} />
                    </div>
                    <div className="max-h-[40%] overflow-y-auto border-t border-neutral-dimmed px-md py-xs">
                        {log}
                    </div>
                </>
            ) : (
                <Scrollbar>
                    <div className="flex flex-col gap-sm px-md py-sm">
                        {entry?.status === "running" ? (
                            <StageWaiting
                                stage={stage}
                                startedOn={entry.startedOn}
                                progress={vm.progressByStage[stage]}
                            />
                        ) : !entry || entry.status === "pending" ? (
                            <Text size="sm" className="text-neutral-strong">
                                This stage hasn&apos;t run yet. Run it to produce its output — the
                                raw artifact is always available in the run inspector.
                            </Text>
                        ) : null}
                        {log}
                    </div>
                </Scrollbar>
            )}
        </div>
    );
});
