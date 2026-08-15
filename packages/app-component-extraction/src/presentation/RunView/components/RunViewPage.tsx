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
import { TokenPanel } from "./TokenPanel.js";
import { OverridesPanel } from "./OverridesPanel.js";
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
import type { RunDto } from "~/shared/types.js";

interface StageEvent extends IncomingGenericData {
    data?: { runId?: string; stage?: string; current?: number; total?: number; message?: string };
}

const runLabel = (run: RunDto): string => `run-${String(run.runNumber).padStart(4, "0")}`;

/** The collapsible "Parameters this stage ran with" card (spec §5) — the facts the run records per stage. */
const ParametersCard = ({ run, stage }: { run: RunDto; stage: Stage }) => {
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
                </div>
            ) : null}
        </div>
    );
};

const RunViewInner = createReactiveComponent(function RunViewInner() {
    const { presenter } = useFeature(RunViewFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Run);
    const websockets = useWebsockets();
    const toast = useToast();

    const runId = route ? route.params.runId : undefined;

    useEffect(() => {
        if (runId) {
            presenter.init(runId);
        }
    }, [presenter, runId]);

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
                        onClick={() => presenter.toggleOverrides()}
                    />
                    <Button
                        variant={vm.showTokens ? "primary" : "secondary"}
                        size="sm"
                        text="Token usage"
                        onClick={() => presenter.toggleTokens()}
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
                                <StageKindSentence kind={meta.kind} />
                            </div>

                            <div className="flex flex-col gap-sm px-md pt-sm">
                                {status === "stale" ? (
                                    <Alert type="warning">
                                        An upstream stage re-ran, so this artifact is stale. Re-run
                                        from here to refresh it and everything after.
                                    </Alert>
                                ) : null}
                                <ParametersCard run={run} stage={selected} />
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
