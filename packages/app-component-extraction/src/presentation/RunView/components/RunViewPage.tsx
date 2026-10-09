import React, { useEffect, useMemo, useState } from "react";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
    Alert,
    Button,
    DropdownMenu,
    Icon,
    OverlayLoader,
    Separator,
    Text,
    cn,
    useToast
} from "@webiny/admin-ui";
import { useWebsockets, type IncomingGenericData } from "@webiny/app-websockets";
import { ReactComponent as ChevronIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { RunViewFeature } from "../feature.js";
import { ArtifactPanel } from "./ArtifactPanel.js";
import { ComposedPagesPanel } from "./composed/ComposedPagesPanel.js";
import { TokenPanel } from "./TokenPanel.js";
import { ThemeCard } from "./ThemeCard.js";
import { OverridesPanel } from "./OverridesPanel.js";
import { SegmentHeightControl } from "./SegmentHeightControl.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { currentStage, stageEntry } from "~/shared/ledger.js";
import {
    STAGES,
    STAGE_DONE_ACTION,
    STAGE_FAILED_ACTION,
    STAGE_LABELS,
    STAGE_PROGRESS_ACTION,
    type Stage
} from "~/constants.js";
import {
    Breadcrumb,
    StageRail,
    StatusDot,
    StatusTag,
    StageKindChip,
    StageKindSentence,
    stageMeta,
    runStageStatuses,
    toDisplayStatus,
    pausedGateStage
} from "~/presentation/shared/index.js";
import { Routes } from "~/routes.js";
import type { RunDto, SegmentArtifactDto } from "~/shared/types.js";

interface StageEvent extends IncomingGenericData {
    data?: { runId?: string; stage?: string; current?: number; total?: number; message?: string };
}

const runLabel = (run: RunDto): string => `run-${String(run.runNumber).padStart(4, "0")}`;

/** The collapsible "Parameters this stage ran with" card (spec §5) — the facts the run records per stage. */
const ParametersCard = ({
    run,
    stage,
    settings
}: {
    run: RunDto;
    stage: Stage;
    /** Editable settings for this stage, when it has any. Rendered beside what it ran with. */
    settings?: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    const entry = stageEntry(run, stage);
    const facts: [string, string][] = [];
    if (entry) {
        facts.push(["version", String(entry.stageVersion)]);
        if (entry.taskId) {
            facts.push(["task", entry.taskId]);
        }
        if (entry.modelUsage) {
            facts.push(["tokens in", String(entry.modelUsage.inputTokens ?? 0)]);
            facts.push(["tokens out", String(entry.modelUsage.outputTokens ?? 0)]);
        }
    }

    return (
        <div className="rounded-lg border border-neutral-dimmed bg-neutral-base">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex w-full cursor-pointer items-center justify-between gap-sm px-md py-sm"
            >
                <Text size="sm" className="font-medium">
                    Parameters this stage ran with
                </Text>
                <Icon
                    icon={<ChevronIcon />}
                    label={open ? "Collapse" : "Expand"}
                    size="sm"
                    className={cn("transition-transform", open && "rotate-180")}
                />
            </button>
            {open ? (
                <div className="flex flex-wrap gap-lg border-t border-neutral-dimmed px-md py-sm">
                    {facts.length === 0 ? (
                        <Text size="sm" className="text-neutral-strong">
                            This stage has not run yet.
                        </Text>
                    ) : (
                        facts.map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-xxs">
                                <Text
                                    size="sm"
                                    className="uppercase tracking-wide text-neutral-strong"
                                >
                                    {key}
                                </Text>
                                <Text size="sm" className="font-mono">
                                    {value}
                                </Text>
                            </div>
                        ))
                    )}
                    {settings}
                </div>
            ) : null}
        </div>
    );
};

const RunViewInner = createReactiveComponent(function RunViewInner() {
    const { presenter } = useFeature(RunViewFeature);
    const { goToRoute } = useRouter();
    const { route, setRouteParams } = useRoute(Routes.Run);
    const websockets = useWebsockets();
    const toast = useToast();

    const runId = route ? route.params.runId : undefined;

    useEffect(() => {
        if (runId) {
            presenter.init(runId);
        }
    }, [presenter, runId]);

    /*
     * The route drives the composed-pages panel, in this one direction only.
     *
     * Every way of opening the panel — the button, the Compare button inside it, a pasted link, the
     * back button, a reload — ends up writing the route, and this brings the view model in line. One
     * writer and one reader, so the URL and what is on screen cannot disagree; a comparison that
     * says one page in the address bar and shows another would defeat the reason this is linkable.
     */
    const composedOpen = Boolean(route?.params.composed);
    const comparedPage = route?.params.page ?? null;

    /*
     * `loadedRunId` is in the deps because the route can open this panel before the run exists. A
     * link lands, the effect runs with `vm.run` still null, and without re-running when the run
     * arrives the panel would sit on "This run has not been composed" having never asked.
     */
    const loadedRunId = presenter.vm.run?.id ?? null;

    useEffect(() => {
        presenter.openComposed(composedOpen, comparedPage);
    }, [presenter, composedOpen, comparedPage, loadedRunId]);

    /*
     * `composed` is removed rather than set to false. The route layer coerces params, and
     * `z.coerce.boolean()` reads the string "false" as `true` because a non-empty string is truthy —
     * so writing `false` would leave the panel stuck open. `RouteUrl` drops undefined values from the
     * query string, which also keeps a closed panel out of the URL entirely.
     */
    const openComposedRoute = (open: boolean, page: string | null) => {
        // Writing the route pushes a history entry, so a write that changes nothing would add a step
        // the back button has to walk through for no reason.
        if (open === composedOpen && (open ? page : null) === comparedPage) {
            return;
        }
        setRouteParams((params: Record<string, unknown>) => ({
            ...params,
            composed: open ? true : undefined,
            page: open && page ? page : undefined
        }));
    };

    /*
     * Opening another panel clears these. Overrides and Token usage keep no route state of their own
     * — they are a developer's own session, not something anyone links to — but leaving `composed` in
     * the URL while a different panel is on screen would make the link lie about what it opens.
     */
    const closeComposedRoute = () => openComposedRoute(false, null);

    useEffect(() => {
        const onEvent = (event: StageEvent) => {
            const data = event.data;
            if (!data || data.runId !== runId) {
                return;
            }
            if (event.action === STAGE_PROGRESS_ACTION && data.stage && data.message) {
                presenter.applyProgress(data.stage, {
                    current: data.current ?? 0,
                    total: data.total ?? 0,
                    message: data.message
                });
                return;
            }
            void presenter.refresh();
        };
        const subs = [STAGE_PROGRESS_ACTION, STAGE_DONE_ACTION, STAGE_FAILED_ACTION].map(action =>
            websockets.onMessage<StageEvent>(action, onEvent)
        );
        return () => subs.forEach(sub => sub.off());
    }, [presenter, runId, websockets]);

    useEffect(() => {
        const interval = setInterval(() => void presenter.refresh(), 3000);
        return () => clearInterval(interval);
    }, [presenter]);

    const { vm } = presenter;
    const run = vm.run;

    const railRows = useMemo(
        () => STAGES.map((stage, index) => ({ stage, status: runStageStatuses(run)[index] })),
        [run]
    );

    if (vm.loading && !run) {
        return <OverlayLoader text="Loading run..." />;
    }
    if (!run) {
        return <Text className="p-md text-neutral-strong">Run not found.</Text>;
    }

    const selected = (vm.selectedStage as Stage | null) ?? currentStage(run) ?? STAGES[0];
    const meta = stageMeta(selected);
    const entry = stageEntry(run, selected);
    const gate = pausedGateStage(run);
    const status = toDisplayStatus(vm.actionStage === selected ? "running" : entry?.status, {
        pausedGate: selected === gate
    });
    const busy = vm.actionStage !== null || run.stages.some(item => item.status === "running");
    const selectedDone = entry?.status === "done" || entry?.status === "stale";
    const hasRun = selectedDone || entry?.status === "failed";
    // The stage immediately after the selected one — where "Continue" leads.
    const nextStage = STAGES[meta.number] as Stage | undefined;
    const earlier = STAGES.slice(0, meta.number - 1).filter(
        stage =>
            stageEntry(run, stage)?.status === "done" || stageEntry(run, stage)?.status === "stale"
    );

    /*
     * What the last Segment run used, read off its own artifact rather than from a default here — a
     * number shown under "parameters this stage ran with" has to be the one it ran with.
     */
    const segmentHeight =
        selected === "segment" && vm.artifactStage === "segment" && vm.artifact
            ? ((vm.artifact as SegmentArtifactDto).maxSectionHeight ?? null)
            : null;

    const runStage = async (stage: Stage) => {
        try {
            await presenter.runStage(stage);
        } catch (error) {
            toast.showWarningToast({
                title: "Could not run stage",
                description: (error as Error).message
            });
        }
    };

    // The primary action adapts to state: run the selected stage if it hasn't produced output yet;
    // once it's done, continue to the next stage (Promote is the finishing action on stage 9).
    const primaryAction: { text: string; target: Stage } | null = !selectedDone
        ? selected === "promote"
            ? { text: "Promote and finish run", target: "promote" }
            : { text: `Run ${meta.number} · ${meta.label}`, target: selected }
        : nextStage
          ? {
                text: `Continue to ${stageMeta(nextStage).number} · ${stageMeta(nextStage).label}`,
                target: nextStage
            }
          : null;

    return (
        <div className="flex h-main-content flex-col">
            <div className="flex items-center justify-between gap-sm px-md py-sm">
                <Breadcrumb
                    items={[
                        { label: "Extractions", onClick: () => goToRoute(Routes.List) },
                        {
                            label: vm.job?.name ?? "Job",
                            onClick: vm.job
                                ? () => goToRoute(Routes.Job, { jobId: vm.job!.id })
                                : undefined
                        },
                        { label: runLabel(run) }
                    ]}
                />
                <div className="flex items-center gap-sm">
                    <Button
                        variant="secondary"
                        size="sm"
                        text="Inspector"
                        onClick={() => goToRoute(Routes.RunInspector, { runId: run.id })}
                    />
                    <Button
                        variant={vm.showOverrides ? "primary" : "secondary"}
                        size="sm"
                        text="Overrides"
                        onClick={() => {
                            presenter.toggleOverrides();
                            closeComposedRoute();
                        }}
                    />
                    <Button
                        variant={vm.showTokens ? "primary" : "secondary"}
                        size="sm"
                        text="Token usage"
                        onClick={() => {
                            presenter.toggleTokens();
                            closeComposedRoute();
                        }}
                    />
                    <Button
                        variant={vm.showComposed ? "primary" : "secondary"}
                        size="sm"
                        text="Composed pages"
                        onClick={() => openComposedRoute(!composedOpen, null)}
                    />
                </div>
            </div>
            <Separator />

            {vm.error ? (
                <div className="border-b border-destructive-dimmed bg-destructive-subtle px-md py-sm">
                    <Text size="sm" className="text-destructive-default">
                        {vm.error}
                    </Text>
                </div>
            ) : null}

            <div className="flex min-h-0 flex-1">
                <div className="w-[300px] flex-shrink-0 overflow-y-auto border-r border-neutral-dimmed p-md">
                    <ThemeCard presenter={presenter} />
                    <StageRail
                        rows={railRows}
                        selected={selected}
                        onSelect={stage => presenter.selectStage(stage)}
                        footer={
                            vm.job ? (
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    text="Back to job"
                                    onClick={() => goToRoute(Routes.Job, { jobId: vm.job!.id })}
                                />
                            ) : undefined
                        }
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    {vm.showTokens ? (
                        <TokenPanel presenter={presenter} />
                    ) : vm.showOverrides ? (
                        <OverridesPanel presenter={presenter} />
                    ) : vm.showComposed ? (
                        <ComposedPagesPanel presenter={presenter} onCompare={openComposedRoute} />
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex flex-col gap-sm border-b border-neutral-dimmed px-md py-sm">
                                <div className="flex flex-wrap items-center justify-between gap-sm">
                                    <div className="flex items-center gap-sm">
                                        <StatusDot status={status} stageNumber={meta.number} />
                                        <Text className="font-medium">
                                            {meta.number} · {meta.label}
                                        </Text>
                                        <StatusTag status={status} />
                                        <StageKindChip kind={meta.kind} />
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        {earlier.length > 0 ? (
                                            <DropdownMenu
                                                trigger={
                                                    <Button
                                                        variant="tertiary"
                                                        size="sm"
                                                        text="Jump back to…"
                                                        disabled={busy}
                                                    />
                                                }
                                            >
                                                {earlier.map(stage => (
                                                    <DropdownMenu.Item
                                                        key={stage}
                                                        text={`${stageMeta(stage).number} · ${STAGE_LABELS[stage]}`}
                                                        onClick={() => void runStage(stage)}
                                                    />
                                                ))}
                                            </DropdownMenu>
                                        ) : null}
                                        {status === "running" ? (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                text={
                                                    vm.actionStage === selected
                                                        ? "Re-running…"
                                                        : "Re-run stage"
                                                }
                                                title="Re-trigger this stage. It resumes from its checkpoint — use this to recover a stage whose background task was interrupted and left it stuck 'running'."
                                                disabled={vm.actionStage !== null}
                                                onClick={() => void runStage(selected)}
                                            />
                                        ) : null}
                                        {hasRun ? (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                text="Re-run this stage"
                                                disabled={busy}
                                                onClick={() => void runStage(selected)}
                                            />
                                        ) : null}
                                        {primaryAction ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                text={primaryAction.text}
                                                disabled={busy}
                                                onClick={() => void runStage(primaryAction.target)}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                <Text size="sm" className="text-neutral-strong">
                                    {meta.description}
                                </Text>
                                <StageKindSentence kind={meta.kind} />
                            </div>

                            <div className="flex flex-col gap-sm px-md pt-sm">
                                {status === "stale" ? (
                                    <Alert type="warning">
                                        An upstream stage re-ran, so this artifact is stale. Re-run
                                        from here to refresh it and everything after.
                                    </Alert>
                                ) : null}
                                <ParametersCard
                                    run={run}
                                    stage={selected}
                                    settings={
                                        selected === "segment" && segmentHeight !== null ? (
                                            <SegmentHeightControl
                                                presenter={presenter}
                                                current={segmentHeight}
                                                disabled={busy}
                                            />
                                        ) : null
                                    }
                                />
                            </div>

                            <div className="min-h-0 flex-1">
                                <ArtifactPanel presenter={presenter} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export const RunViewPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        RunViewFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RunViewInner />
        </DiContainerProvider>
    );
};
