import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, CheckboxPrimitive, Input, Tag, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { normalizeUrl } from "~/shared/url.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    DiscoverArtifactDto,
    DiscoverUrlDto,
    DiscoverySummaryDto,
    OverrideDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const pathOf = (url: string): string => {
    try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search || "/";
    } catch {
        return url;
    }
};

/** A friendly name for a path-prefix group: "/" → "Root", "/product" → "Product", "manual" → added. */
const groupName = (group: string): string => {
    if (group === "manual") {
        return "Manually added";
    }
    const segment = group.replace(/^\//, "").split("/")[0];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Root";
};

const groupPrefix = (group: string): string => (group === "manual" ? "" : group || "/");

/*
 * Provenance, as the operator needs to read it. "Both" is the healthy case. "Sitemap only" is the row
 * that needs a human: the crawl never reached it, so it is either an orphan page nothing links to or an
 * entry the CMS left behind, and only someone who knows the site can say which.
 */
const SOURCE_LABELS: Record<
    string,
    { label: string; variant: "success-light" | "accent-light" | "neutral-muted" | "accent" }
> = {
    both: { label: "Both", variant: "success-light" },
    sitemap: { label: "Sitemap only", variant: "accent-light" },
    crawl: { label: "Crawl", variant: "neutral-muted" },
    manual: { label: "Added", variant: "accent" }
};

const SourceTag = ({ source }: { source?: string }) => {
    const descriptor = source ? SOURCE_LABELS[source] : undefined;
    if (!descriptor) {
        return null;
    }
    return <Tag variant={descriptor.variant} content={descriptor.label} />;
};

/*
 * What resolving the URL returned. An off-site redirect is labelled rather than shown as its status:
 * the status is usually a healthy 200, and printing that next to an excluded row would read as a
 * contradiction when the row is excluded precisely because the 200 came from somewhere else.
 */
const ResolveStatus = ({ url }: { url: DiscoverUrlDto }) => {
    const resolution = url.resolution;
    if (!resolution) {
        return null;
    }

    const label = (() => {
        if (resolution.offSite) {
            return "off-site";
        }
        if (resolution.status === null) {
            return "unreachable";
        }
        const redirected = resolution.finalUrl && resolution.finalUrl !== url.url;
        return redirected ? `${resolution.status} →` : String(resolution.status);
    })();

    return (
        <Text
            size="sm"
            className={cn(
                "w-24 flex-shrink-0 text-right font-mono",
                resolution.ok ? "text-neutral-strong" : "text-destructive-primary"
            )}
        >
            {label}
        </Text>
    );
};

/** How the sitemap was read, said plainly rather than as a status code. */
const SITEMAP_STATUS_TEXT: Record<DiscoverySummaryDto["sitemapStatus"], string> = {
    absent: "no sitemap",
    "not-sitemap": "not a sitemap",
    empty: "empty sitemap",
    "root-only": "sitemap lists only the home page",
    used: "sitemap used"
};

/*
 * The two sources side by side. A sitemap claiming 40 pages when the crawl found 9 is visible here,
 * before capture spends a run on it, rather than afterwards when the generated components are wrong.
 */
const DiscoverySummary = ({
    discovery,
    included,
    pageCap
}: {
    discovery: DiscoverySummaryDto;
    included: number;
    pageCap: number;
}) => {
    const sitemapDetail = [
        `claimed ${discovery.sitemapClaimed}`,
        discovery.sitemapOffHost > 0 ? `${discovery.sitemapOffHost} off-host` : null,
        discovery.sitemapNonPage > 0 ? `${discovery.sitemapNonPage} not pages` : null,
        discovery.sitemapUnresolved > 0 ? `${discovery.sitemapUnresolved} dead` : null,
        `${discovery.sitemapUsable} usable`,
        discovery.sitemapTruncated ? "truncated" : null
    ].filter(Boolean);

    return (
        <div className="flex flex-col gap-xxs">
            <Text size="sm" className="text-neutral-strong">
                <span className="font-semibold">
                    {SITEMAP_STATUS_TEXT[discovery.sitemapStatus]}
                </span>
                {discovery.sitemapClaimed > 0 ? ` · ${sitemapDetail.join(" · ")}` : ""}
            </Text>
            <Text size="sm" className="text-neutral-strong">
                <span className="font-semibold">Crawl</span> · {discovery.crawled} found · depth{" "}
                {discovery.crawlDepth}
                {discovery.crawlTruncated ? " · cut short, links left to follow" : ""}
            </Text>
            <Text size="sm" className="text-neutral-strong">
                <span className="font-semibold">Union</span> · {discovery.union} resolved ·{" "}
                {included} included · page cap {pageCap}
                {discovery.overCap > 0 ? ` · ${discovery.overCap} over the cap` : ""}
            </Text>
        </div>
    );
};

/** Rows the run discovered but will not capture: the URL did not answer, or answered from elsewhere. */
const UnresolvedList = ({ urls }: { urls: DiscoverUrlDto[] }) => (
    <div className="mt-md overflow-hidden rounded-lg border border-neutral-dimmed">
        <div className="flex items-center gap-sm bg-neutral-light px-md py-sm">
            <Text size="sm" className="font-semibold">
                Discovered, not captured
            </Text>
            <Text size="sm" className="text-neutral-strong">
                {urls.length} listed or linked but not a page of this site — gone, never published,
                or redirecting somewhere else
            </Text>
        </div>
        {urls.map(url => (
            <div
                key={url.url}
                className="flex items-center gap-sm border-t border-neutral-dimmed px-md py-xs"
            >
                <Text
                    size="sm"
                    className="w-56 flex-shrink-0 truncate font-mono text-neutral-strong"
                >
                    {pathOf(url.url)}
                </Text>
                <div className="min-w-0 flex-1" />
                <SourceTag source={url.source} />
                <ResolveStatus url={url} />
            </div>
        ))}
    </div>
);

/**
 * The Discover gate (spec §6.1). The discovered URLs grouped by path prefix inside one card: each group
 * header names the prefix and its included count and toggles the whole section; each row is a checkbox,
 * the path, its provenance and what resolving it returned. Excluding, re-including or manually adding a
 * URL writes a discover.url override that reattaches across runs and marks Capture + downstream stale —
 * applied immediately, no separate save.
 */
export const DiscoverView = createReactiveComponent(function DiscoverView({ presenter }: Props) {
    const { vm } = presenter;
    // Read the machine list so excluded URLs remain visible (the effective list would have dropped them).
    const artifact =
        vm.machineArtifactStage === "discover"
            ? (vm.machineArtifact as DiscoverArtifactDto | null)
            : (vm.artifact as DiscoverArtifactDto | null);
    const pageCap = vm.job?.pageCap ?? 0;
    const [manualInput, setManualInput] = useState("");

    // The exclude/add state comes entirely from the job's discover overrides.
    const excluded = useMemo(
        () =>
            new Set(
                vm.overrides
                    .filter(
                        (override: OverrideDto) =>
                            override.stage === "discover" &&
                            ((override.correction.kind === "discover.url" &&
                                override.correction.action === "exclude") ||
                                override.correction.kind === "page.exclude")
                    )
                    .map(override => override.structuralSignature)
            ),
        [vm.overrides]
    );
    const manual = useMemo(
        () =>
            vm.overrides
                .filter(
                    override =>
                        override.stage === "discover" &&
                        override.correction.kind === "discover.url" &&
                        override.correction.action === "add"
                )
                .map(override => ({
                    url: override.structuralSignature,
                    group: "manual",
                    source: "manual" as const
                })) as DiscoverUrlDto[],
        [vm.overrides]
    );

    const groups = useMemo(() => {
        const all = [...(artifact?.urls ?? []), ...manual];
        const byGroup = new Map<string, DiscoverUrlDto[]>();
        for (const item of all) {
            const list = byGroup.get(item.group) ?? [];
            list.push(item);
            byGroup.set(item.group, list);
        }
        return [...byGroup.entries()];
    }, [artifact, manual]);

    if (vm.artifactLoading && !artifact?.urls) {
        return <Text className="p-md text-neutral-strong">Loading discovered URLs…</Text>;
    }
    if (!artifact?.urls) {
        return (
            <Text className="p-md text-neutral-strong">Run Discover to produce a URL list.</Text>
        );
    }

    const total = artifact.urls.length + manual.length;
    const includedCount = total - excluded.size;
    const isExcluded = (url: string) => excluded.has(normalizeUrl(url));
    const unresolved = artifact.unresolved ?? [];

    const addManual = () => {
        const url = manualInput.trim();
        if (!url) {
            return;
        }
        void presenter.addDiscoverUrl(url);
        setManualInput("");
    };

    // Include/exclude the whole group — toggle only the rows that need changing.
    const toggleGroup = async (items: DiscoverUrlDto[], includeAll: boolean) => {
        for (const item of items) {
            const included = !isExcluded(item.url);
            if (includeAll && !included) {
                await presenter.setDiscoverExclusion(item.url, false);
            } else if (!includeAll && included) {
                await presenter.setDiscoverExclusion(item.url, true);
            }
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-col gap-sm border-b border-neutral-dimmed px-md py-sm">
                {artifact.discovery ? (
                    <DiscoverySummary
                        discovery={artifact.discovery}
                        included={includedCount}
                        pageCap={pageCap}
                    />
                ) : (
                    <Text size="sm" className="text-neutral-strong">
                        {artifact.urls.length} URLs discovered · {includedCount} included · page cap{" "}
                        {pageCap}
                    </Text>
                )}
                <div className="flex items-center gap-sm">
                    <Input
                        value={manualInput}
                        onChange={(value: string) => setManualInput(value)}
                        placeholder="https://www.example.com/specific-page"
                        disabled={vm.clusterBusy}
                        onEnter={addManual}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<AddIcon />}
                        text="Add"
                        disabled={vm.clusterBusy}
                        onClick={addManual}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="overflow-hidden rounded-lg border border-neutral-dimmed">
                    {groups.map(([group, items], groupIndex) => {
                        const groupIncluded = items.filter(item => !isExcluded(item.url)).length;
                        const allIncluded = groupIncluded === items.length;
                        return (
                            <div key={group}>
                                <div
                                    className={cn(
                                        "flex items-center gap-sm bg-neutral-light px-md py-sm",
                                        groupIndex > 0 && "border-t border-neutral-dimmed"
                                    )}
                                >
                                    <CheckboxPrimitive
                                        checked={allIncluded}
                                        disabled={vm.clusterBusy}
                                        onChange={() => void toggleGroup(items, !allIncluded)}
                                    />
                                    <Text size="sm" className="font-semibold">
                                        {groupName(group)}
                                    </Text>
                                    {groupPrefix(group) ? (
                                        <Text size="sm" className="font-mono text-neutral-strong">
                                            {groupPrefix(group)}
                                        </Text>
                                    ) : null}
                                    <div className="flex-1" />
                                    <Text size="sm" className="text-neutral-strong">
                                        {groupIncluded} of {items.length} included
                                    </Text>
                                </div>
                                {items.map(item => {
                                    const included = !isExcluded(item.url);
                                    return (
                                        <div
                                            key={item.url}
                                            className="flex items-center gap-sm border-t border-neutral-dimmed px-md py-xs"
                                        >
                                            <CheckboxPrimitive
                                                checked={included}
                                                disabled={vm.clusterBusy}
                                                onChange={() =>
                                                    void presenter.setDiscoverExclusion(
                                                        item.url,
                                                        included
                                                    )
                                                }
                                            />
                                            <Text
                                                size="sm"
                                                className={cn(
                                                    "w-56 flex-shrink-0 truncate font-mono",
                                                    !included && "text-neutral-strong line-through"
                                                )}
                                            >
                                                {pathOf(item.url)}
                                            </Text>
                                            {item.title ? (
                                                <Text
                                                    size="sm"
                                                    className={cn(
                                                        "min-w-0 flex-1 truncate",
                                                        !included
                                                            ? "text-neutral-strong line-through"
                                                            : "text-neutral-strong"
                                                    )}
                                                >
                                                    {item.title}
                                                </Text>
                                            ) : (
                                                <div className="min-w-0 flex-1" />
                                            )}
                                            <SourceTag source={item.source} />
                                            <ResolveStatus url={item} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {unresolved.length > 0 ? <UnresolvedList urls={unresolved} /> : null}
            </div>
        </div>
    );
});
