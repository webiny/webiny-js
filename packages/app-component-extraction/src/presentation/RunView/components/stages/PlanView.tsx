import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Heading, Tag, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../../abstractions.js";
import type { PlanArtifactDto, PlannedComponentDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const num = (value: number): string => value.toLocaleString();

const pageCountOf = (component: PlannedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

/**
 * The Plan gate (W7.9 slice). The hard gate: before Generate runs, project its cost — the number of
 * planned components times the mean tokens per generate call from this job's prior runs — so approving
 * is a decision, not a rubber stamp. With no prior run there is no mean to project from, so the
 * component count is shown alone rather than a made-up figure. Below the projection, the planned
 * components; the primary action approves the plan and starts the (paid) generation.
 *
 * Prop editing (§5.6) is out of this pass's scope — this establishes the projection and the gate.
 */
export const PlanView = createReactiveComponent(function PlanView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as PlanArtifactDto | null;
    const projection = vm.planProjection;
    const generating = vm.actionStage === "generate";

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading plan…</Text>;
    }
    if (!artifact || artifact.components.length === 0) {
        return (
            <Text className="p-md text-neutral-strong">Run Plan to produce a component plan.</Text>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-start justify-between gap-md px-md py-sm border-b border-neutral-dimmed">
                <div className="flex flex-col gap-xxs min-w-0">
                    <Heading level={6}>Approve plan</Heading>
                    {projection ? (
                        projection.meanTokensPerCall !== null ? (
                            <Text size="sm" className="text-neutral-strong">
                                ~{num(projection.projectedTokens ?? 0)} tokens projected ·{" "}
                                {projection.components} component(s) × ~
                                {num(projection.meanTokensPerCall)}/call, from{" "}
                                {projection.priorRuns} prior run(s)
                            </Text>
                        ) : (
                            <Text size="sm" className="text-neutral-strong">
                                {projection.components} component(s) to generate · no prior run of
                                this job to project cost from
                            </Text>
                        )
                    ) : (
                        <Text size="sm" className="text-neutral-strong">
                            {artifact.components.length} component(s) to generate
                        </Text>
                    )}
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    text={generating ? "Starting…" : "Approve plan & generate"}
                    disabled={generating}
                    onClick={() => void presenter.runStage("generate")}
                />
            </div>

            <div className="px-md pt-sm">
                <Alert type="warning" variant="subtle">
                    Approving starts the paid part of the run — Generate makes a model call per
                    component.
                </Alert>
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="flex flex-col gap-xs">
                    {artifact.components.map(component => (
                        <div
                            key={component.signature}
                            className="flex items-center justify-between gap-sm px-sm py-xs border border-neutral-dimmed rounded-sm"
                        >
                            <div className="flex items-center gap-sm min-w-0">
                                <Text size="sm" className="font-medium truncate">
                                    {component.name}
                                </Text>
                                <Tag variant="neutral-muted" content={component.type} />
                            </div>
                            <Text size="sm" className="text-neutral-strong whitespace-nowrap">
                                {pageCountOf(component)} page(s)
                            </Text>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
