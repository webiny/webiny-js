import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Input, Select, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { ClassifiedClusterDto, ClassifyArtifactDto, OverrideDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// The Classify taxonomy (mirrors the backend), plus "unclassified" for a section that isn't a component.
const TYPE_OPTIONS = [
    "hero",
    "features",
    "cta",
    "testimonial",
    "pricing",
    "faq",
    "header",
    "footer",
    "gallery",
    "stats",
    "logos",
    "form",
    "content",
    "other",
    "unclassified"
].map(value => ({ value, label: value }));

const overrideFor = (overrides: OverrideDto[], signature: string): OverrideDto | undefined =>
    overrides.find(
        override => override.stage === "classify" && override.structuralSignature === signature
    );

const machineFor = (
    machine: ClassifyArtifactDto | null,
    signature: string
): ClassifiedClusterDto | undefined =>
    machine?.clusters.find(entry => entry.cluster.signature === signature);

const ClassifyRow = ({
    presenter,
    runId,
    entry,
    override,
    machine
}: {
    presenter: RunViewPresenter.Interface;
    runId: string;
    entry: ClassifiedClusterDto;
    override: OverrideDto | undefined;
    machine: ClassifiedClusterDto | undefined;
}) => {
    const { vm } = presenter;
    const signature = entry.cluster.signature;
    const [name, setName] = useState(entry.name);

    const commitName = () => {
        if (name.trim() && name !== entry.name) {
            void presenter.setClassification(signature, name.trim(), undefined);
        }
    };

    // The machine's original values, shown when this row has been corrected.
    const machineChanged =
        override && machine && (machine.name !== entry.name || machine.type !== entry.type);

    return (
        <div className="flex items-start gap-md px-md py-sm border-b border-neutral-dimmed">
            <div className="w-24 flex-shrink-0 aspect-[3/2] bg-neutral-light rounded-sm overflow-hidden">
                <RunImage
                    runId={runId}
                    imageRef={entry.cluster.representativeCrop.cropRef}
                    alt={signature}
                    className="w-full h-full object-cover object-top"
                />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-xs">
                <div className="flex items-center gap-sm">
                    <Tag
                        variant={entry.confidence < 0.5 ? "warning" : "neutral-muted"}
                        content={`${Math.round(entry.confidence * 100)}% confident`}
                    />
                    {override ? <Tag variant="accent" content="corrected" /> : null}
                    {entry.unclassified ? <Tag variant="warning" content="unclassified" /> : null}
                </div>
                <div className="flex items-center gap-sm">
                    <div className="flex-1 min-w-0">
                        <Input
                            label="Name"
                            value={name}
                            disabled={vm.clusterBusy}
                            onChange={(value: string) => setName(value)}
                            onBlur={commitName}
                            onEnter={commitName}
                        />
                    </div>
                    <div className="w-40 flex-shrink-0">
                        <Select
                            label="Type"
                            value={entry.type}
                            options={TYPE_OPTIONS}
                            disabled={vm.clusterBusy}
                            onChange={(value: string) =>
                                void presenter.setClassification(signature, undefined, value)
                            }
                        />
                    </div>
                </div>
                {machineChanged ? (
                    <Text size="sm" className="text-neutral-strong">
                        machine: {machine!.name} · {machine!.type}
                    </Text>
                ) : null}
            </div>
        </div>
    );
};

/**
 * The Classify view (W8.4). One row per cluster, sorted by confidence ascending so the least certain get
 * attention first: an editable name and a type picker (the taxonomy plus "unclassified"). An edited row
 * carries a "corrected" badge and shows the machine's original name/type — the difference the correction
 * log records. Each change writes a classify.set override that reattaches across runs.
 */
export const ClassifyView = createReactiveComponent(function ClassifyView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as ClassifyArtifactDto | null;
    const machine =
        vm.machineArtifactStage === "classify"
            ? (vm.machineArtifact as ClassifyArtifactDto | null)
            : null;
    const runId = vm.run?.id ?? "";

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading classifications…</Text>;
    }
    if (!artifact?.clusters?.length) {
        return <Text className="p-md text-neutral-strong">Run Classify to type the clusters.</Text>;
    }

    // Least certain first, so the classifications that most need review are at the top.
    const rows = [...artifact.clusters].sort((a, b) => a.confidence - b.confidence);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {rows.length} clusters · least certain first
                </Text>
            </div>
            <div className="flex-1 overflow-y-auto">
                {rows.map(entry => (
                    <ClassifyRow
                        key={entry.cluster.signature}
                        presenter={presenter}
                        runId={runId}
                        entry={entry}
                        override={overrideFor(vm.overrides, entry.cluster.signature)}
                        machine={machineFor(machine, entry.cluster.signature)}
                    />
                ))}
            </div>
        </div>
    );
});
