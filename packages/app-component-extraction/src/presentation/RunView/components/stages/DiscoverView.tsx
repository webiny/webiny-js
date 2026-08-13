import React, { useEffect, useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Input, Separator, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { RunViewPresenter } from "../../abstractions.js";
import type { DiscoverArtifactDto, DiscoverUrlDto } from "~/shared/types.js";

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
 * The Discover gate (W7.3). Shows the sampled URLs grouped by path prefix, lets the operator exclude
 * some and add specific ones, and rewrites the list Capture consumes — which marks Capture and
 * everything downstream stale. A bad URL sample produces bad clustering no matter how good the rest is.
 */
export const DiscoverView = createReactiveComponent(function DiscoverView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as DiscoverArtifactDto | null;
    const pageCap = vm.job?.pageCap ?? 0;

    const [excluded, setExcluded] = useState<Set<string>>(new Set());
    const [manual, setManual] = useState<DiscoverUrlDto[]>([]);
    const [manualInput, setManualInput] = useState("");
    const [saving, setSaving] = useState(false);

    // Reset the local edit state whenever a fresh artifact loads (after a save or stage re-run).
    useEffect(() => {
        setExcluded(new Set());
        setManual([]);
    }, [artifact]);

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

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading discovered URLs…</Text>;
    }
    if (!artifact) {
        return (
            <Text className="p-md text-neutral-strong">Run Discover to produce a URL list.</Text>
        );
    }

    const total = artifact.urls.length + manual.length;
    const includedCount = total - excluded.size;

    const toggle = (url: string) =>
        setExcluded(prev => {
            const next = new Set(prev);
            if (next.has(url)) {
                next.delete(url);
            } else {
                next.add(url);
            }
            return next;
        });

    const setGroup = (items: DiscoverUrlDto[], include: boolean) =>
        setExcluded(prev => {
            const next = new Set(prev);
            for (const item of items) {
                if (include) {
                    next.delete(item.url);
                } else {
                    next.add(item.url);
                }
            }
            return next;
        });

    const addManual = () => {
        const url = manualInput.trim();
        if (!url) {
            return;
        }
        setManual(prev => [...prev, { url, group: "manual" }]);
        setManualInput("");
    };

    const save = async () => {
        setSaving(true);
        const urls = [...(artifact.urls ?? []), ...manual].filter(item => !excluded.has(item.url));
        await presenter.updateDiscoverUrls(
            urls.map(item => ({ url: item.url, group: item.group }))
        );
        setSaving(false);
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.urls.length} discovered · {includedCount} included · cap {pageCap} ·
                    via {artifact.source}
                </Text>
                <Button
                    variant="primary"
                    size="sm"
                    text={saving ? "Saving…" : "Save URL list"}
                    disabled={saving}
                    onClick={() => void save()}
                />
            </div>

            <div className="flex items-center gap-sm px-md py-sm">
                <Input
                    value={manualInput}
                    onChange={(value: string) => setManualInput(value)}
                    placeholder="https://www.example.com/specific-page"
                    onEnter={addManual}
                />
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<AddIcon />}
                    text="Add"
                    onClick={addManual}
                />
            </div>
            <Separator />

            <div className="flex-1 overflow-y-auto">
                {groups.map(([group, items]) => {
                    const groupIncluded = items.filter(item => !excluded.has(item.url)).length;
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
                                <div className="flex items-center gap-xs">
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        text="All"
                                        onClick={() => setGroup(items, true)}
                                    />
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        text="None"
                                        onClick={() => setGroup(items, false)}
                                    />
                                </div>
                            </div>
                            {items.map(item => {
                                const isIncluded = !excluded.has(item.url);
                                return (
                                    <label
                                        key={item.url}
                                        className="flex items-center gap-sm px-md py-xs cursor-pointer hover:bg-neutral-light"
                                    >
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer"
                                            checked={isIncluded}
                                            onChange={() => toggle(item.url)}
                                        />
                                        <Text
                                            size="sm"
                                            className={`font-mono truncate ${isIncluded ? "" : "text-neutral-strong line-through"}`}
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
