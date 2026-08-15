import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Select, Slider, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { ClusterArtifactDto, ClusterDto, OverrideDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const pathOf = (url: string): string => {
    try {
        return new URL(url).pathname || "/";
    } catch {
        return url;
    }
};

const distinctPages = (cluster: ClusterDto): string[] => [
    ...new Set(cluster.members.map(member => member.url))
];

/** The override attached to a cluster (its representative signature), for the badge and restore action. */
const overrideForCluster = (overrides: OverrideDto[], signature: string): OverrideDto | undefined =>
    overrides.find(
        override => override.stage === "cluster" && override.structuralSignature === signature
    );

/** Solid badge = correction set in this run; dashed = reattached from an earlier run. */
const OverrideBadge = ({ override, runId }: { override: OverrideDto; runId: string }) => {
    const thisRun = override.originRunId === runId;
    const label = String(override.correction.kind).replace("cluster.", "");
    return thisRun ? (
        <Tag variant="accent" content={label} />
    ) : (
        <span className="inline-flex items-center rounded-sm border border-dashed border-accent-default px-xs text-xs text-accent-default">
            {label} · reattached
        </span>
    );
};

// Plain memoised component (NOT an observer): it renders only when its own props change. `selected` and
// `busy` are passed in by the observing ClusterView, so toggling one cluster's selection re-renders that
// one card, not every card (and every crop image) in the grid.
const ClusterCard = React.memo(function ClusterCard({
    presenter,
    runId,
    cluster,
    clusters,
    override,
    index,
    selected,
    busy
}: {
    presenter: RunViewPresenter.Interface;
    runId: string;
    cluster: ClusterDto;
    clusters: ClusterDto[];
    override: OverrideDto | undefined;
    index: number;
    selected: boolean;
    busy: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [splitMembers, setSplitMembers] = useState<string[]>([]);
    const pages = distinctPages(cluster);

    const toggleMember = (signature: string) =>
        setSplitMembers(current =>
            current.includes(signature)
                ? current.filter(item => item !== signature)
                : [...current, signature]
        );

    const submitSplit = () => {
        void presenter.splitClusterMembers(cluster.signature, splitMembers);
        setSplitMembers([]);
    };

    // Other clusters a member can be moved into — labelled by their card number (the #N badge on the
    // grid) and member count so they're distinguishable, since their structure strings are usually
    // identical. The representative's page is appended only when it's actually known.
    const moveTargets = clusters
        .map((other, position) => ({ other, number: position + 1 }))
        .filter(entry => entry.other.signature !== cluster.signature && !entry.other.excluded)
        .map(entry => {
            const count = entry.other.members.length;
            const page = pathOf(entry.other.representative.url ?? "");
            return {
                value: entry.other.signature,
                label: `Cluster #${entry.number} · ${count} member${count === 1 ? "" : "s"}${
                    page ? ` · ${page}` : ""
                }`
            };
        });

    return (
        <div
            className={`flex flex-col rounded-sm overflow-hidden border ${
                selected ? "border-primary-default" : "border-neutral-dimmed"
            } ${cluster.excluded ? "opacity-50" : ""}`}
        >
            {/* The whole crop is the selection target — a reliable, large hit area. */}
            <div
                className="relative aspect-[3/2] bg-neutral-light overflow-hidden cursor-pointer"
                onClick={() => presenter.toggleClusterSelection(cluster.signature)}
                title={selected ? "Click to deselect" : "Click to select"}
            >
                <RunImage
                    runId={runId}
                    imageRef={cluster.representativeCrop.cropRef}
                    alt={cluster.signature}
                    className="w-full h-full object-cover object-top"
                />
                {selected ? (
                    <div className="absolute inset-0 ring-2 ring-inset ring-primary-default bg-primary-default/10" />
                ) : null}
                <div className="absolute top-xs left-xs">
                    <span
                        className={`inline-flex items-center justify-center min-w-5 h-5 px-xxs rounded-sm text-xs font-medium ${
                            selected
                                ? "bg-primary-default text-neutral-light"
                                : "bg-neutral-base/80 text-neutral-strong"
                        }`}
                    >
                        {selected ? "✓" : `#${index + 1}`}
                    </span>
                </div>
                <div className="absolute top-xs right-xs flex flex-col items-end gap-xxs">
                    {override ? <OverrideBadge override={override} runId={runId} /> : null}
                    {cluster.excluded ? <Tag variant="neutral-muted" content="excluded" /> : null}
                </div>
            </div>
            <div className="p-sm flex flex-col gap-xxs">
                <Text size="sm" className="font-mono truncate">
                    #{index + 1} · {cluster.digest?.structure || cluster.signature.slice(0, 20)}
                </Text>
                <div className="flex items-center gap-xs">
                    <Tag variant="neutral-muted" content={`${cluster.members.length} members`} />
                    <Tag variant="neutral-muted" content={`${pages.length} pages`} />
                </div>

                <div className="flex items-center gap-sm mt-xxs">
                    <Text
                        size="sm"
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {expanded ? "Hide members" : "Show members"}
                    </Text>
                    <div className="flex-1" />
                    {cluster.excluded && override ? (
                        <Button
                            variant="tertiary"
                            size="sm"
                            text="Restore"
                            disabled={busy}
                            onClick={() => void presenter.clearOverride(override.id)}
                        />
                    ) : (
                        <Button
                            variant="tertiary"
                            size="sm"
                            text="Exclude"
                            disabled={busy}
                            onClick={() => void presenter.excludeCluster(cluster.signature)}
                        />
                    )}
                </div>

                {expanded ? (
                    <div className="flex flex-col gap-xs mt-xs">
                        <Text size="sm" className="text-neutral-strong">
                            Click members to select them, then Split; or Move one into another
                            cluster.
                        </Text>
                        {splitMembers.length > 0 ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                text={`Split ${splitMembers.length} into a new cluster`}
                                disabled={busy}
                                onClick={submitSplit}
                            />
                        ) : null}
                        <div className="grid grid-cols-2 gap-xs">
                            {cluster.members.map(member => {
                                const memberSelected = splitMembers.includes(member.signature);
                                return (
                                    <div
                                        key={member.signature + member.url}
                                        className="flex flex-col gap-xxs"
                                    >
                                        <div
                                            className={`relative aspect-[3/2] bg-neutral-light overflow-hidden rounded-xs cursor-pointer ${
                                                memberSelected
                                                    ? "ring-2 ring-inset ring-primary-default"
                                                    : ""
                                            }`}
                                            onClick={() => toggleMember(member.signature)}
                                        >
                                            <RunImage
                                                runId={runId}
                                                imageRef={member.cropRef}
                                                alt={member.url}
                                                className="w-full h-full object-cover object-top"
                                            />
                                            {memberSelected ? (
                                                <div className="absolute inset-0 bg-primary-default/10" />
                                            ) : null}
                                        </div>
                                        <Text
                                            size="sm"
                                            className="font-mono truncate text-neutral-strong"
                                        >
                                            {pathOf(member.url)}
                                        </Text>
                                        {moveTargets.length > 0 ? (
                                            <Select
                                                value=""
                                                placeholder="Move to…"
                                                options={moveTargets}
                                                disabled={busy}
                                                onChange={(target: string) =>
                                                    void presenter.moveClusterMember(
                                                        member.signature,
                                                        target
                                                    )
                                                }
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
});

/** The similarity-threshold control: a slider previewing the cluster count, with Apply re-running Cluster. */
const ThresholdControl = ({
    presenter,
    artifact
}: {
    presenter: RunViewPresenter.Interface;
    artifact: ClusterArtifactDto;
}) => {
    const { vm } = presenter;
    const current = artifact.threshold ?? 0.85;
    const [pct, setPct] = useState(Math.round(current * 100));
    const threshold = pct / 100;
    const curve = artifact.thresholdCurve ?? [];
    const previewCount = curve.find(
        point => Math.abs(point.threshold - threshold) < 0.001
    )?.clusters;
    const changed = Math.abs(threshold - current) > 0.001;
    const clusterCorrections = vm.overrides.filter(
        override => override.stage === "cluster" && override.correction.kind !== "cluster.threshold"
    ).length;

    return (
        <div className="flex flex-col gap-xs px-md py-sm border-b border-neutral-dimmed">
            <div className="flex items-center gap-md">
                <div className="flex-1 min-w-0">
                    <Slider
                        label="Similarity"
                        value={pct}
                        min={50}
                        max={100}
                        step={5}
                        disabled={vm.clusterBusy}
                        transformValue={(value: number) => `${value}%`}
                        onValueChange={(value: number) => setPct(value)}
                    />
                </div>
                <Text size="sm" className="text-neutral-strong whitespace-nowrap">
                    {previewCount !== undefined
                        ? `${previewCount} clusters`
                        : `${artifact.clusters.length} clusters`}
                </Text>
                <Button
                    variant="primary"
                    size="sm"
                    text="Apply"
                    disabled={!changed || vm.clusterBusy}
                    onClick={() => void presenter.applyThreshold(threshold)}
                />
            </div>
            <Text size="sm" className="text-neutral-strong">
                {artifact.nearestPair !== undefined
                    ? `Closest clusters are ${Math.round(artifact.nearestPair * 100)}% similar. `
                    : ""}
                Lower the threshold to merge more; raise it to split.
            </Text>
            {changed && clusterCorrections > 0 ? (
                <Alert type="warning" variant="subtle">
                    {`Re-clustering rebuilds the clusters — up to ${clusterCorrections} correction(s) may not reattach.`}
                </Alert>
            ) : null}
        </div>
    );
};

const SelectionBar = ({ presenter }: Props) => {
    const { vm } = presenter;
    if (vm.selectedClusters.length === 0) {
        return null;
    }
    return (
        <div className="flex items-center gap-sm px-md py-sm border-b border-neutral-dimmed bg-neutral-light">
            <Text size="sm" className="font-medium">
                {vm.selectedClusters.length} selected
            </Text>
            <div className="flex-1" />
            <Button
                variant="secondary"
                size="sm"
                text="Merge"
                disabled={vm.selectedClusters.length < 2 || vm.clusterBusy}
                onClick={() => void presenter.mergeSelectedClusters()}
            />
            <Button
                variant="tertiary"
                size="sm"
                text="Clear"
                disabled={vm.clusterBusy}
                onClick={() => presenter.clearClusterSelection()}
            />
        </div>
    );
};

/**
 * The Cluster view (W7.6 gallery + W8.3 correction controls). Cards are selectable (checkbox) for a bulk
 * Merge; each card can be Excluded (muted, restorable) and, expanded, its members can be checked to Split
 * into a new cluster or moved into another. Corrections carry a badge — solid when set in this run, dashed
 * when reattached from an earlier one. Clustering is exact structural-signature matching; the similarity
 * threshold slider is deferred (it needs threshold-based clustering, which does not exist yet).
 */
export const ClusterView = createReactiveComponent(function ClusterView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as ClusterArtifactDto | null;
    const runId = vm.run?.id ?? "";

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading clusters…</Text>;
    }
    if (!artifact?.clusters?.length) {
        return <Text className="p-md text-neutral-strong">Run Cluster to group sections.</Text>;
    }

    const active = artifact.clusters.filter(cluster => !cluster.excluded).length;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {active} active{" "}
                    {artifact.clusters.length - active > 0
                        ? `· ${artifact.clusters.length - active} excluded `
                        : ""}
                    {artifact.threshold !== undefined
                        ? ` · clustered at ${Math.round(artifact.threshold * 100)}% similarity`
                        : " · exact structural match"}
                </Text>
            </div>
            <ThresholdControl presenter={presenter} artifact={artifact} />
            <SelectionBar presenter={presenter} />
            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-4 gap-md">
                    {artifact.clusters.map((cluster, index) => (
                        <ClusterCard
                            key={cluster.signature}
                            presenter={presenter}
                            runId={runId}
                            cluster={cluster}
                            clusters={artifact.clusters}
                            override={overrideForCluster(vm.overrides, cluster.signature)}
                            index={index}
                            selected={vm.selectedClusters.includes(cluster.signature)}
                            busy={vm.clusterBusy}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});
