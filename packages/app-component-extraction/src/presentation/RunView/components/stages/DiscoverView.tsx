import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Checkbox, Input, Text, cn } from "@webiny/admin-ui";
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

/**
 * The Discover gate (spec §6.1). The discovered URLs grouped by path prefix inside one card: each group
 * header names the prefix and its included count and toggles the whole section; each row is a checkbox and
 * the path. Excluding, re-including or manually adding a URL writes a discover.url override that reattaches
 * across runs and marks Capture + downstream stale — applied immediately, no separate save.
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

    const total = artifact.urls.length + manual.length;
    const includedCount = total - excluded.size;
    const isExcluded = (url: string) => excluded.has(normalizeUrl(url));

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
                <Text size="sm" className="text-neutral-strong">
                    {artifact.urls.length} URLs discovered · {includedCount} included · page cap{" "}
                    {pageCap}
                </Text>
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
                                    <Checkbox
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
                                            <Checkbox
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
                                                    "truncate font-mono",
                                                    !included && "text-neutral-strong line-through"
                                                )}
                                            >
                                                {pathOf(item.url)}
                                            </Text>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
