import React, { useEffect, useMemo } from "react";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
    Button,
    Checkbox,
    Heading,
    Icon,
    ProgressBar,
    Separator,
    Tag,
    Text,
    TimeAgo,
    Tooltip,
    cn,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as NoteIcon } from "@webiny/icons/sticky_note_2.svg";
import { ReactComponent as ArrowIcon } from "@webiny/icons/arrow_forward.svg";
import { JobDetailFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { currentStage, stageEntry } from "~/shared/ledger.js";
import { STAGES, STAGE_LABELS, type Stage } from "~/constants.js";
import {
    Breadcrumb,
    StageRail,
    StageStatus,
    StatusTag,
    StageKindSentence,
    stageMeta,
    runOverallStatus,
    runStageStatuses,
    pausedGateStage,
    type DisplayStatus
} from "~/presentation/shared/index.js";
import { Routes } from "~/routes.js";
import type { JobDto, RunDto } from "~/shared/types.js";

const runLabel = (run: RunDto): string => `run-${String(run.runNumber).padStart(4, "0")}`;

/** What each stage produces, for the selected-stage summary (spec §4). */
const PRODUCES: Record<Stage, string> = {
    discover: "A crawl URL list",
    capture: "Full-page screenshots",
    segment: "Page sections",
    cluster: "Section clusters",
    classify: "Typed, named clusters",
    plan: "Component contracts",
    generate: "Generated components",
    assemble: "Assembled pages",
    promote: "Library components"
};

const artifactSummary = (run: RunDto | null, stage: Stage): string => {
    if (!run) {
        return "—";
    }
    const c = run.counts;
    switch (stage) {
        case "discover":
        case "capture":
            return `${c.pages} pages`;
        case "segment":
            return `${c.sections} sections`;
        case "cluster":
        case "classify":
            return `${c.clusters} clusters`;
        default:
            return `${c.components} components`;
    }
};

/** One sentence describing where the run is right now. */
const runSentence = (run: RunDto | null, overall: DisplayStatus): string => {
    if (!run) {
        return "This job has not run yet. Start a run to begin the pipeline.";
    }
    const gate = pausedGateStage(run);
    const active = currentStage(run);
    switch (overall) {
        case "running":
            return `Running ${active ? STAGE_LABELS[active] : "the pipeline"} — safe to leave, it continues in the background.`;
        case "paused":
            return `Paused at ${gate ? STAGE_LABELS[gate] : "a gate"}. Review it, then continue when you are ready.`;
        case "failed":
            return "Some items failed. Review them, then retry or continue without them.";
        case "stale":
            return "Upstream changes left later stages stale. Re-run from the earliest stale stage.";
        case "complete":
            return "The run finished. Start a new run to extract again.";
        default:
            return "This run has not started.";
    }
};

/** A titled fact cell in the selected-stage summary. */
const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-xxs">
        <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
            {label}
        </Text>
        <Text size="sm">{value}</Text>
    </div>
);

/** The current-run panel (spec §4): status, id + start, a sentence, and the state's primary action. */
const CurrentRunPanel = ({
    run,
    starting,
    onStart,
    onOpenRun
}: {
    run: RunDto | null;
    starting: boolean;
    onStart: () => void;
    onOpenRun: () => void;
}) => {
    const overall = runOverallStatus(run);
    const failed = run?.stages.filter(entry => entry.status === "failed") ?? [];

    const action =
        !run || overall === "complete" || overall === "stale"
            ? {
                  text: starting ? "Starting…" : run ? "Start new run" : "Start run",
                  onClick: onStart
              }
            : overall === "paused"
              ? { text: "Review run", onClick: onOpenRun }
              : overall === "failed"
                ? { text: "Review failures", onClick: onOpenRun }
                : { text: "View progress", onClick: onOpenRun };

    return (
        <div className="flex flex-col gap-sm rounded-lg border border-neutral-dimmed bg-neutral-base p-md">
            <div className="flex items-center justify-between gap-sm">
                <div className="flex items-center gap-sm">
                    <Text className="font-medium">Current run</Text>
                    <StatusTag status={overall} />
                </div>
                {run ? (
                    <Text size="sm" className="text-neutral-strong">
                        {runLabel(run)} · started <TimeAgo datetime={run.createdOn} />
                    </Text>
                ) : null}
            </div>

            <Text size="sm" className="text-neutral-strong">
                {runSentence(run, overall)}
            </Text>

            {overall === "running" ? (
                <div className="flex flex-col gap-xxs">
                    <ProgressBar value={100} max={100} className="animate-pulse" />
                    <Text size="sm" className="text-neutral-strong">
                        Safe to leave. The run continues in the background.
                    </Text>
                </div>
            ) : null}

            {failed.length > 0 ? (
                <div className="flex flex-col gap-xs rounded-sm bg-destructive-subtle p-sm">
                    {failed.map(entry => (
                        <div key={entry.stage} className="flex items-start gap-sm">
                            <Text size="sm" className="font-mono">
                                {STAGE_LABELS[entry.stage as Stage]}
                            </Text>
                            <Text size="sm" className="text-destructive-primary">
                                {entry.error ?? "failed"}
                            </Text>
                        </div>
                    ))}
                    <div className="flex items-center gap-sm">
                        <Button
                            variant="secondary"
                            size="sm"
                            text="Retry failed"
                            onClick={onOpenRun}
                        />
                        <Tooltip
                            content="Continuing without failed items is not available yet"
                            trigger={
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    text="Continue without them"
                                    disabled
                                />
                            }
                        />
                    </div>
                </div>
            ) : null}

            <div>
                <Button variant="primary" size="sm" text={action.text} onClick={action.onClick} />
            </div>
        </div>
    );
};

/** The selected-stage summary (spec §4): identity, kind, a link into the stage, and four fact cells. */
const SelectedStageSummary = ({
    run,
    job,
    stage,
    overrideCount,
    onOpenStage
}: {
    run: RunDto | null;
    job: JobDto;
    stage: Stage;
    overrideCount: number;
    onOpenStage: () => void;
}) => {
    const meta = stageMeta(stage);
    const entry = run ? stageEntry(run, stage) : undefined;
    const status = runStageStatuses(run)[meta.number - 1];
    const reached = !!entry && entry.status !== "pending";
    const pausesAfter = job.gateConfig.stopAfter.includes(stage);

    return (
        <div className="flex flex-col gap-sm rounded-lg border border-neutral-dimmed bg-neutral-base p-md">
            <div className="flex items-center justify-between gap-sm">
                <StageStatus status={status} stageNumber={meta.number} />
                <button
                    type="button"
                    onClick={onOpenStage}
                    className="flex cursor-pointer items-center gap-xxs text-primary hover:underline"
                >
                    <Text size="sm" className="text-primary">
                        Open stage view
                    </Text>
                    <Icon
                        icon={<ArrowIcon />}
                        label="Open"
                        size="xs"
                        className="[&_svg]:fill-primary"
                    />
                </button>
            </div>
            <div className="flex items-center gap-sm">
                <Text className="font-medium">
                    {meta.number} · {meta.label}
                </Text>
            </div>
            <StageKindSentence kind={meta.kind} />

            {reached ? (
                <div className="grid grid-cols-2 gap-md pt-xs md:grid-cols-4">
                    <Fact label="Produces" value={PRODUCES[stage]} />
                    <Fact label="Artifact" value={artifactSummary(run, stage)} />
                    <Fact label="Gate" value={pausesAfter ? "Pauses after" : "Runs through"} />
                    <Fact
                        label="Overrides"
                        value={overrideCount > 0 ? `${overrideCount} active` : "None"}
                    />
                </div>
            ) : (
                <div className="rounded-sm bg-neutral-light p-sm">
                    <Text size="sm" className="text-neutral-strong">
                        Not reached yet — this stage runs after the ones before it. Its data appears
                        once the run gets here.
                    </Text>
                </div>
            )}
        </div>
    );
};

/** Run history (spec §4): a table with selection; Compare is disabled this pass. */
const RunHistory = ({
    runs,
    selectedRunIds,
    onToggle
}: {
    runs: RunDto[];
    selectedRunIds: string[];
    onToggle: (runId: string) => void;
}) => (
    <div className="flex flex-col gap-sm rounded-lg border border-neutral-dimmed bg-neutral-base p-md">
        <div className="flex items-center justify-between gap-sm">
            <Text className="font-medium">Run history</Text>
            <div className="flex items-center gap-sm">
                <Text size="sm" className="text-neutral-strong">
                    {selectedRunIds.length === 2 ? "2 runs selected" : "Select two runs to compare"}
                </Text>
                <Tooltip
                    content="Run comparison is not available yet"
                    trigger={<Button variant="secondary" size="sm" text="Compare" disabled />}
                />
            </div>
        </div>
        <div className="flex flex-col">
            <div className="grid grid-cols-[24px_1fr_120px_100px_1fr_40px] gap-sm border-b border-neutral-dimmed pb-xs">
                {["", "Run", "Reached", "Components", "Note", ""].map((h, index) => (
                    <Text
                        key={index}
                        size="sm"
                        className="uppercase tracking-wide text-neutral-strong"
                    >
                        {h}
                    </Text>
                ))}
            </div>
            {runs.map(run => {
                const reached = currentStage(run);
                return (
                    <div
                        key={run.id}
                        className="grid grid-cols-[24px_1fr_120px_100px_1fr_40px] items-center gap-sm border-b border-neutral-dimmed py-xs"
                    >
                        <Checkbox
                            checked={selectedRunIds.includes(run.id)}
                            onChange={() => onToggle(run.id)}
                        />
                        <div className="flex flex-col">
                            <Text size="sm" className="font-mono">
                                {runLabel(run)}
                            </Text>
                            <TimeAgo datetime={run.createdOn} />
                        </div>
                        <Tag
                            variant="neutral-light"
                            content={reached ? STAGE_LABELS[reached] : "Complete"}
                        />
                        <Text size="sm">{run.counts.components}</Text>
                        <Text size="sm" className="truncate text-neutral-strong">
                            {run.note || "—"}
                        </Text>
                        {/* Per-run pin needs the run's `pinned` field in the list query (W10). */}
                        <span />
                    </div>
                );
            })}
        </div>
    </div>
);

/** Promoted-to-Library grid (spec §4), with its empty variant. */
const PromotedGrid = ({ promoted }: { promoted: { componentId: string; name: string }[] }) => (
    <div className="flex flex-col gap-sm rounded-lg border border-neutral-dimmed bg-neutral-base p-md">
        <Text className="font-medium">Promoted to Library</Text>
        {promoted.length === 0 ? (
            <Text size="sm" className="text-neutral-strong">
                Components reach the Library at stage 9, once you promote them.
            </Text>
        ) : (
            <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
                {promoted.map(component => (
                    <div
                        key={component.componentId}
                        className="flex flex-col gap-xxs rounded-sm border border-neutral-dimmed p-sm"
                    >
                        <div className="aspect-[3/2] rounded-xs bg-neutral-light" />
                        <Text size="sm" className="truncate font-medium">
                            {component.name}
                        </Text>
                        <Text size="sm" className="text-neutral-strong">
                            In Library
                        </Text>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const JobDetailContent = createReactiveComponent(function JobDetailContent() {
    const { presenter } = useFeature(JobDetailFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Job);
    const toast = useToast();
    const { vm } = presenter;
    const jobId = route?.params.jobId;

    useEffect(() => {
        if (jobId) {
            presenter.init(jobId);
        }
    }, [presenter, jobId]);

    const run = presenter.currentRun;
    const goList = () => goToRoute(Routes.List);
    const openRun = () => {
        if (run) {
            goToRoute(Routes.Run, { runId: run.id });
        }
    };
    const startRun = async () => {
        try {
            const runId = await presenter.startRun();
            toast.showSuccessToast({ title: "Extraction run started." });
            goToRoute(Routes.Run, { runId });
        } catch (error) {
            toast.showWarningToast({
                title: "Could not start run",
                description: (error as Error).message
            });
        }
    };

    const railRows = useMemo(
        () => STAGES.map((stage, index) => ({ stage, status: runStageStatuses(run)[index] })),
        [run]
    );

    if (vm.loading && !vm.job) {
        return <Text className="p-md text-neutral-strong">Loading job…</Text>;
    }
    const job = vm.job;
    if (!job) {
        return <Text className="p-md text-neutral-strong">Job not found.</Text>;
    }

    const selected = vm.selectedStage ?? STAGES[0];
    const overrideCount = vm.overrides.filter(override => override.stage === selected).length;

    return (
        <div className="flex flex-col gap-lg p-md">
            <Breadcrumb items={[{ label: "Extractions", onClick: goList }, { label: job.name }]} />

            <div className="flex flex-col gap-sm">
                <div className="flex items-start justify-between gap-md">
                    <div className="flex items-center gap-sm">
                        <Icon
                            icon={<PinIcon />}
                            label={job.pinned ? "Pinned" : "Not pinned"}
                            size="md"
                            className={cn(
                                job.pinned ? "[&_svg]:fill-primary" : "[&_svg]:fill-neutral-muted"
                            )}
                        />
                        <Heading level={4}>{job.name}</Heading>
                    </div>
                    <div className="flex items-center gap-sm">
                        <Tooltip
                            content="The run inspector is not available yet"
                            trigger={
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    text="Run inspector"
                                    disabled
                                />
                            }
                        />
                        <Tooltip
                            content="Editing configuration is not available yet"
                            trigger={
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    text="Edit configuration"
                                    disabled
                                />
                            }
                        />
                    </div>
                </div>
                <Text size="sm" className="text-neutral-strong">
                    {job.siteUrl} · Theme v{job.themeVersion}
                </Text>
                <div className="flex items-start gap-sm rounded-sm border border-dashed border-neutral-muted p-sm">
                    <Icon
                        icon={<NoteIcon />}
                        label="Note"
                        size="sm"
                        className="[&_svg]:fill-neutral-strong"
                    />
                    <Text size="sm" className="text-neutral-strong">
                        {job.note || "No note on this job."}
                    </Text>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-lg lg:grid-cols-[262px_1fr]">
                <div className="lg:sticky lg:top-md lg:self-start">
                    <StageRail
                        rows={railRows}
                        selected={selected}
                        onSelect={stage => presenter.selectStage(stage)}
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-lg">
                    <CurrentRunPanel
                        run={run}
                        starting={vm.startingRun}
                        onStart={() => void startRun()}
                        onOpenRun={openRun}
                    />
                    <SelectedStageSummary
                        run={run}
                        job={job}
                        stage={selected}
                        overrideCount={overrideCount}
                        onOpenStage={openRun}
                    />
                    <RunHistory
                        runs={vm.runs}
                        selectedRunIds={vm.selectedRunIds}
                        onToggle={runId => presenter.toggleRunSelection(runId)}
                    />
                    <PromotedGrid promoted={vm.promoted} />
                </div>
            </div>
        </div>
    );
});

export const JobDetailPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        JobDetailFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <div className="h-main-content overflow-y-auto bg-neutral-subtle">
                <JobDetailContent />
            </div>
        </DiContainerProvider>
    );
};
