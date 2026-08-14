import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Checkbox, Select, Tag, Text } from "@webiny/admin-ui";
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

const ClusterCard = ({
    presenter,
    runId,
    cluster,
    clusters,
    override
}: {
    presenter: RunViewPresenter.Interface;
    runId: string;
    cluster: ClusterDto;
    clusters: ClusterDto[];
    override: OverrideDto | undefined;
}) => {
    const { vm } = presenter;
    const [expanded, setExpanded] = useState(false);
    const [splitMembers, setSplitMembers] = useState<string[]>([]);
    const pages = distinctPages(cluster);
    const selected = vm.selectedClusters.includes(cluster.signature);

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

    // Other clusters a member can be moved into.
    const moveTargets = clusters
        .filter(other => other.signature !== cluster.signature && !other.excluded)
        .map(other => ({
            value: other.signature,
            label: other.digest?.structure || other.signature.slice(0, 16)
        }));

    return (
        <div
            className={`flex flex-col rounded-sm overflow-hidden border ${
                selected ? "border-primary-default" : "border-neutral-dimmed"
            } ${cluster.excluded ? "opacity-50" : ""}`}
        >
            <div className="relative aspect-[3/2] bg-neutral-light overflow-hidden">
                <RunImage
                    runId={runId}
                    imageRef={cluster.representativeCrop.cropRef}
                    alt={cluster.signature}
                    className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-xs left-xs bg-neutral-base/80 rounded-sm">
                    <Checkbox
                        checked={selected}
                        onChange={() => presenter.toggleClusterSelection(cluster.signature)}
                    />
                </div>
                <div className="absolute top-xs right-xs flex flex-col items-end gap-xxs">
                    {override ? <OverrideBadge override={override} runId={runId} /> : null}
                    {cluster.excluded ? <Tag variant="neutral-muted" content="excluded" /> : null}
                </div>
            </div>
            <div className="p-sm flex flex-col gap-xxs">
                <Text size="sm" className="font-mono truncate">
                    {cluster.digest?.structure || cluster.signature.slice(0, 24)}
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
                            disabled={vm.clusterBusy}
                            onClick={() => void presenter.clearOverride(override.id)}
                        />
                    ) : (
                        <Button
                            variant="tertiary"
                            size="sm"
                            text="Exclude"
                            disabled={vm.clusterBusy}
                            onClick={() => void presenter.excludeCluster(cluster.signature)}
                        />
                    )}
                </div>

                {expanded ? (
                    <div className="flex flex-col gap-xs mt-xs">
                        {splitMembers.length > 0 ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                text={`Split ${splitMembers.length} into a new cluster`}
                                disabled={vm.clusterBusy}
                                onClick={submitSplit}
                            />
                        ) : null}
                        <div className="grid grid-cols-2 gap-xs">
                            {cluster.members.map(member => (
                                <div
                                    key={member.signature + member.url}
                                    className="flex flex-col gap-xxs"
                                >
                                    <div className="relative aspect-[3/2] bg-neutral-light overflow-hidden rounded-xs">
                                        <RunImage
                                            runId={runId}
                                            imageRef={member.cropRef}
                                            alt={member.url}
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <div className="absolute top-xxs left-xxs bg-neutral-base/80 rounded-sm">
                                            <Checkbox
                                                checked={splitMembers.includes(member.signature)}
                                                onChange={() => toggleMember(member.signature)}
                                            />
                                        </div>
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
                                            onChange={(target: string) =>
                                                void presenter.moveClusterMember(
                                                    member.signature,
                                                    target
                                                )
                                            }
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
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
                    · exact structural match
                </Text>
            </div>
            <SelectionBar presenter={presenter} />
            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-4 gap-md">
                    {artifact.clusters.map(cluster => (
                        <ClusterCard
                            key={cluster.signature}
                            presenter={presenter}
                            runId={runId}
                            cluster={cluster}
                            clusters={artifact.clusters}
                            override={overrideForCluster(vm.overrides, cluster.signature)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});
