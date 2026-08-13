import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { ClusterArtifactDto, ClusterDto } from "~/shared/types.js";

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

const ClusterCard = ({ runId, cluster }: { runId: string; cluster: ClusterDto }) => {
    const [expanded, setExpanded] = useState(false);
    const pages = distinctPages(cluster);

    return (
        <div className="flex flex-col rounded-sm overflow-hidden border border-neutral-dimmed">
            <div className="aspect-[3/2] bg-neutral-light overflow-hidden">
                <RunImage
                    runId={runId}
                    imageRef={cluster.representativeCrop.cropRef}
                    alt={cluster.signature}
                    className="w-full h-full object-cover object-top"
                />
            </div>
            <div className="p-sm flex flex-col gap-xxs">
                <Text size="sm" className="font-mono truncate">
                    {cluster.digest?.structure || cluster.signature.slice(0, 24)}
                </Text>
                <div className="flex items-center gap-xs">
                    <Tag variant="neutral-muted" content={`${cluster.members.length} members`} />
                    <Tag variant="neutral-muted" content={`${pages.length} pages`} />
                </div>
                <Text
                    size="sm"
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => setExpanded(prev => !prev)}
                >
                    {expanded ? "Hide members" : "Show members"}
                </Text>
                {expanded ? (
                    <div className="grid grid-cols-2 gap-xs mt-xs">
                        {cluster.members.map((member, index) => (
                            <div key={index} className="flex flex-col gap-xxs">
                                <div className="aspect-[3/2] bg-neutral-light overflow-hidden rounded-xs">
                                    <RunImage
                                        runId={runId}
                                        imageRef={member.cropRef}
                                        alt={member.url}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                                <Text size="sm" className="font-mono truncate text-neutral-strong">
                                    {pathOf(member.url)}
                                </Text>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/**
 * The Cluster view (W7.6), read-only. A gallery of cluster cards — representative crop, member count and
 * the pages it appears on, expandable to every member crop. Correction controls (merge/split/threshold)
 * are out of scope this pass. Clustering here is exact structural-signature matching, not threshold-based,
 * so there is no similarity threshold or nearest-pair distance to read out.
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

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.clusters.length} clusters · exact structural match (no similarity
                    threshold this pass)
                </Text>
            </div>
            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-4 gap-md">
                    {artifact.clusters.map(cluster => (
                        <ClusterCard key={cluster.signature} runId={runId} cluster={cluster} />
                    ))}
                </div>
            </div>
        </div>
    );
});
