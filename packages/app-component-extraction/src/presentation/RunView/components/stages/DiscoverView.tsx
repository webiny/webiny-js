import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Input, Separator, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { normalizeUrl } from "~/shared/url.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { DiscoverArtifactDto, DiscoverUrlDto, OverrideDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const pathOf = (url: string): string => {
    try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search;
    } catch {
        return url;
    }
};

/**
 * The Discover gate (W7.3 + W8 overrides). Shows the discovered URLs (the machine list, so an excluded
 * one stays visible and struck through) grouped by path prefix, plus any manually-added ones. Excluding a
 * URL, re-including it, or adding one writes a discover.url override that reattaches across runs and marks
 * Capture + downstream stale — applied immediately, no separate save.
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
                    group: "manual"
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

    const includedCount = artifact.urls.length + manual.length - excluded.size;
    const isExcluded = (url: string) => excluded.has(normalizeUrl(url));

    const addManual = () => {
        const url = manualInput.trim();
        if (!url) {
            return;
        }
        void presenter.addDiscoverUrl(url);
        setManualInput("");
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.urls.length} discovered · {includedCount} included · cap {pageCap} ·
                    via {artifact.source}
                </Text>
            </div>

            <div className="flex items-center gap-sm px-md py-sm">
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
            <Separator />

            <div className="flex-1 overflow-y-auto">
                {groups.map(([group, items]) => {
                    const groupIncluded = items.filter(item => !isExcluded(item.url)).length;
                    return (
                        <div key={group} className="border-b border-neutral-dimmed">
                            <div className="flex items-center justify-between px-md py-sm bg-neutral-light">
                                <div className="flex items-center gap-sm">
                                    <Heading level={6}>{group}</Heading>
                                    <Tag
                                        variant="neutral-muted"
                                        content={`${groupIncluded}/${items.length}`}
                                    />
                                </div>
                            </div>
                            {items.map(item => {
                                const included = !isExcluded(item.url);
                                return (
                                    <label
                                        key={item.url}
                                        className="flex items-center gap-sm px-md py-xs cursor-pointer hover:bg-neutral-light"
                                    >
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer"
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
                                            className={`font-mono truncate ${included ? "" : "text-neutral-strong line-through"}`}
                                        >
                                            {pathOf(item.url)}
                                        </Text>
                                    </label>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
