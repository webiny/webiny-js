import React, { useEffect, useMemo, useState } from "react";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { Button, Heading, Separator, Tabs, Tag, Text, TimeAgo, cn } from "@webiny/admin-ui";
import { RunInspectorFeature } from "../feature.js";
import { ComponentExtractionGatewayFeature } from "~/features/gateway/feature.js";
import { stageEntry } from "~/shared/ledger.js";
import { STAGES, STAGE_LABELS, type Stage } from "~/constants.js";
import { Breadcrumb, stageMeta } from "~/presentation/shared/index.js";
import { Routes } from "~/routes.js";
import type { RunInspectorPresenter } from "../abstractions.js";
import type { ModelCallDto, OverrideDto, ReattachmentDto, RunDto } from "~/shared/types.js";

type Presenter = RunInspectorPresenter.Interface;

const runLabel = (run: RunDto): string => `run-${String(run.runNumber).padStart(4, "0")}`;
const bytes = (json: string | null): string => (json ? `${new Blob([json]).size} B` : "—");
const num = (value: number): string => value.toLocaleString();

/** Artifacts tab (spec §7): the stage artifact list beside a read-only JSON pane. */
const ArtifactsTab = ({ presenter }: { presenter: Presenter }) => {
    const { vm } = presenter;
    const run = vm.run;
    const stagesWithOutput = STAGES.filter(stage => {
        const status = run ? stageEntry(run, stage)?.status : undefined;
        return status === "done" || status === "stale";
    });
    const selected = vm.selectedArtifactStage;
    const entry = run && selected ? stageEntry(run, selected) : undefined;

    return (
        <div className="flex min-h-0 gap-md">
            <div className="w-[340px] flex-shrink-0 overflow-y-auto rounded-lg border border-neutral-dimmed">
                {stagesWithOutput.length === 0 ? (
                    <Text size="sm" className="p-md text-neutral-strong">
                        No stage has produced an artifact yet.
                    </Text>
                ) : (
                    stagesWithOutput.map(stage => (
                        <button
                            key={stage}
                            type="button"
                            onClick={() => void presenter.selectArtifactStage(stage)}
                            className={cn(
                                "flex w-full cursor-pointer items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm text-left hover:bg-neutral-light",
                                selected === stage && "bg-neutral-light"
                            )}
                        >
                            <Text size="sm">
                                {stageMeta(stage).number} · {STAGE_LABELS[stage]}
                            </Text>
                            <Text size="sm" className="text-neutral-strong">
                                {stageEntry(run!, stage)?.status}
                            </Text>
                        </button>
                    ))
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-neutral-dimmed">
                {!selected ? (
                    <Text size="sm" className="p-md text-neutral-strong">
                        Select an artifact to inspect its JSON.
                    </Text>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
                            <div className="flex items-center gap-sm">
                                <Text size="sm" className="font-medium">
                                    {STAGE_LABELS[selected]}
                                </Text>
                                <Tag variant="success-light" content="Schema valid" />
                            </div>
                            <Text size="sm" className="text-neutral-strong">
                                {bytes(vm.artifactJson)}
                                {entry?.finishedOn ? (
                                    <>
                                        {" · produced "}
                                        <TimeAgo datetime={entry.finishedOn} />
                                    </>
                                ) : null}
                            </Text>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto bg-neutral-subtle p-md">
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                                {vm.artifactLoading
                                    ? "Loading…"
                                    : (vm.artifactJson ?? "No artifact.")}
                            </pre>
                        </div>
                        <div className="border-t border-neutral-dimmed px-md py-sm">
                            <Text size="sm" className="text-neutral-strong">
                                Read-only here. Editing the artifact and re-validating against the
                                stage schema (the escape hatch) is a backend addition still to come.
                            </Text>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/** Model calls tab (spec §7): stage filter pills, totals, and per-call rows. */
const ModelCallsTab = ({ presenter }: { presenter: Presenter }) => {
    const { vm } = presenter;
    const modelStages = ["all", ...new Set(vm.modelCalls.map(call => call.stage))];
    const calls =
        vm.modelStageFilter === "all"
            ? vm.modelCalls
            : vm.modelCalls.filter(call => call.stage === vm.modelStageFilter);
    const totals = calls.reduce(
        (acc, call) => ({
            input: acc.input + call.inputTokens,
            output: acc.output + call.outputTokens,
            ms: acc.ms + call.latencyMs
        }),
        { input: 0, output: 0, ms: 0 }
    );

    return (
        <div className="flex flex-col gap-sm">
            <div className="flex flex-wrap items-center gap-xs">
                {modelStages.map(stage => (
                    <Button
                        key={stage}
                        variant={vm.modelStageFilter === stage ? "primary" : "secondary"}
                        size="sm"
                        text={stage === "all" ? "All stages" : STAGE_LABELS[stage as Stage]}
                        onClick={() => presenter.setModelStageFilter(stage)}
                    />
                ))}
            </div>
            <Text size="sm" className="text-neutral-strong">
                {calls.length} calls · {num(totals.input)} tokens in · {num(totals.output)} out ·{" "}
                {(totals.ms / 1000).toFixed(1)} s total
            </Text>
            <div className="rounded-lg border border-neutral-dimmed">
                <div className="grid grid-cols-[120px_1fr_140px_100px] gap-sm border-b border-neutral-dimmed px-md py-xs">
                    {["Stage", "Call", "Tokens", "Latency"].map(header => (
                        <Text
                            key={header}
                            size="sm"
                            className="uppercase tracking-wide text-neutral-strong"
                        >
                            {header}
                        </Text>
                    ))}
                </div>
                {calls.length === 0 ? (
                    <Text size="sm" className="p-md text-neutral-strong">
                        No model calls recorded for this run.
                    </Text>
                ) : (
                    calls.map((call: ModelCallDto, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-[120px_1fr_140px_100px] items-center gap-sm border-b border-neutral-dimmed px-md py-xs last:border-b-0"
                        >
                            <Text size="sm">{STAGE_LABELS[call.stage as Stage] ?? call.stage}</Text>
                            <Text size="sm" className="truncate font-mono">
                                {call.name}
                            </Text>
                            <Text size="sm">
                                {num(call.inputTokens)} / {num(call.outputTokens)}
                            </Text>
                            <Text size="sm">{(call.latencyMs / 1000).toFixed(1)} s</Text>
                        </div>
                    ))
                )}
            </div>
            <Text size="sm" className="text-neutral-strong">
                Prompt and response bodies are not captured yet (W7.1 excluded them from storage);
                this tab is their only consumer, so capturing them with a size cap is the remaining
                backend addition.
            </Text>
        </div>
    );
};

/** Overrides tab (spec §7): the active table plus a separately framed "could not reattach" card. */
const OverridesTab = ({ presenter }: { presenter: Presenter }) => {
    const { vm } = presenter;
    const runId = vm.run?.id;
    const unresolved = vm.reattachments.filter(entry => entry.status !== "applied");

    return (
        <div className="flex flex-col gap-md">
            <div className="rounded-lg border border-neutral-dimmed">
                <div className="grid grid-cols-[120px_1fr_1fr] gap-sm border-b border-neutral-dimmed px-md py-xs">
                    {["Stage", "Correction", "Origin"].map(header => (
                        <Text
                            key={header}
                            size="sm"
                            className="uppercase tracking-wide text-neutral-strong"
                        >
                            {header}
                        </Text>
                    ))}
                </div>
                {vm.overrides.length === 0 ? (
                    <Text size="sm" className="p-md text-neutral-strong">
                        No overrides are active on this job.
                    </Text>
                ) : (
                    vm.overrides.map((override: OverrideDto) => (
                        <div
                            key={override.id}
                            className="grid grid-cols-[120px_1fr_1fr] items-center gap-sm border-b border-neutral-dimmed px-md py-xs last:border-b-0"
                        >
                            <Text size="sm">
                                {STAGE_LABELS[override.stage as Stage] ?? override.stage}
                            </Text>
                            <Text size="sm" className="truncate font-mono">
                                {override.correction.kind}
                            </Text>
                            <Tag
                                variant={
                                    override.originRunId === runId
                                        ? "accent-light"
                                        : "neutral-light"
                                }
                                content={
                                    override.originRunId === runId
                                        ? "Set in this run"
                                        : "Reattached from a previous run"
                                }
                            />
                        </div>
                    ))
                )}
            </div>

            {unresolved.length > 0 ? (
                <div className="rounded-lg border border-warning bg-warning-subtle p-md">
                    <Text size="sm" className="font-medium">
                        Could not reattach
                    </Text>
                    <div className="mt-xs flex flex-col gap-xs">
                        {unresolved.map((entry: ReattachmentDto, index) => (
                            <div key={index} className="flex items-start gap-sm">
                                <Tag variant="neutral-light" content={entry.kind} />
                                <Text size="sm" className="text-neutral-strong">
                                    {entry.reason ?? "no matching signature this run"}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

/** Configuration tab (spec §7): the theme binding line and per-stage parameters. */
const ConfigurationTab = ({ presenter }: { presenter: Presenter }) => {
    const { vm } = presenter;
    const run = vm.run;
    return (
        <div className="flex flex-col gap-md">
            <div className="rounded-lg border border-neutral-dimmed p-md">
                <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
                    Theme binding
                </Text>
                <Text size="sm">
                    {vm.job ? `${vm.job.siteUrl} · Theme v${vm.job.themeVersion}` : "—"}
                </Text>
            </div>
            <div className="rounded-lg border border-neutral-dimmed">
                <div className="grid grid-cols-[1fr_100px_1fr] gap-sm border-b border-neutral-dimmed px-md py-xs">
                    {["Stage", "Version", "Task"].map(header => (
                        <Text
                            key={header}
                            size="sm"
                            className="uppercase tracking-wide text-neutral-strong"
                        >
                            {header}
                        </Text>
                    ))}
                </div>
                {STAGES.map(stage => {
                    const entry = run ? stageEntry(run, stage) : undefined;
                    return (
                        <div
                            key={stage}
                            className="grid grid-cols-[1fr_100px_1fr] items-center gap-sm border-b border-neutral-dimmed px-md py-xs last:border-b-0"
                        >
                            <Text size="sm">
                                {stageMeta(stage).number} · {STAGE_LABELS[stage]}
                            </Text>
                            <Text size="sm" className="font-mono">
                                {entry ? entry.stageVersion : "—"}
                            </Text>
                            <Text size="sm" className="truncate font-mono text-neutral-strong">
                                {entry?.taskId ?? "—"}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RunInspectorInner = createReactiveComponent(function RunInspectorInner() {
    const { presenter } = useFeature(RunInspectorFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.RunInspector);
    const [tab, setTab] = useState("artifacts");

    const runId = route?.params.runId;

    useEffect(() => {
        if (runId) {
            presenter.init(runId);
        }
    }, [presenter, runId]);

    const { vm } = presenter;
    const run = vm.run;

    const tabs = useMemo(
        () => [
            <Tabs.Tab
                key="artifacts"
                value="artifacts"
                trigger="Artifacts"
                content={<ArtifactsTab presenter={presenter} />}
            />,
            <Tabs.Tab
                key="model"
                value="model"
                trigger="Model calls"
                content={<ModelCallsTab presenter={presenter} />}
            />,
            <Tabs.Tab
                key="overrides"
                value="overrides"
                trigger="Overrides"
                content={<OverridesTab presenter={presenter} />}
            />,
            <Tabs.Tab
                key="config"
                value="config"
                trigger="Configuration"
                content={<ConfigurationTab presenter={presenter} />}
            />
        ],
        [presenter]
    );

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
                        {
                            label: run ? runLabel(run) : "Run",
                            onClick: run
                                ? () => goToRoute(Routes.Run, { runId: run.id })
                                : undefined
                        },
                        { label: "Run inspector" }
                    ]}
                />
                {run ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        text="Close"
                        onClick={() => goToRoute(Routes.Run, { runId: run.id })}
                    />
                ) : null}
            </div>
            <Separator />

            <div className="min-h-0 flex-1 overflow-y-auto p-md">
                {vm.error ? (
                    <Text size="sm" className="text-destructive-default">
                        {vm.error}
                    </Text>
                ) : (
                    <>
                        <Heading level={5} className="mb-sm">
                            {run ? runLabel(run) : "Run"} · inspector
                        </Heading>
                        <Tabs value={tab} onValueChange={setTab} tabs={tabs} />
                    </>
                )}
            </div>
        </div>
    );
});

export const RunInspectorPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ComponentExtractionGatewayFeature.register(child);
        RunInspectorFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <RunInspectorInner />
        </DiContainerProvider>
    );
};
