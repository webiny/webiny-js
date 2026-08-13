import React, { useEffect, useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { CaptureArtifactDto, CapturePageDto } from "~/shared/types.js";

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

const median = (values: number[]): number => {
    if (values.length === 0) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

interface Tile {
    url: string;
    label: string;
    page: CapturePageDto | null;
    failed: boolean;
    /** Capture-quality warnings (short page, consent overlay, broken images). */
    warnings: string[];
}

/**
 * The Capture view (W7.4). A thumbnail grid of the captured pages, five across, with failed pages and
 * flagged pages sorted to the top. A flag is a capture-quality warning: an unusually short page, a
 * cookie/consent overlay the browser could not dismiss, or images that failed to load. Opening a tile
 * shows the full-page screenshot. Pages can be selected and excluded so a bad capture doesn't flow into
 * Segment (which marks Segment and everything downstream stale).
 */
export const CaptureView = createReactiveComponent(function CaptureView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as CaptureArtifactDto | null;
    const runId = vm.run?.id ?? "";
    const [lightbox, setLightbox] = useState<CapturePageDto | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [excluding, setExcluding] = useState(false);

    // Clear the selection whenever a fresh artifact loads (after an exclude or a Capture re-run).
    useEffect(() => {
        setSelected(new Set());
    }, [artifact]);

    const tiles = useMemo<Tile[]>(() => {
        if (!artifact) {
            return [];
        }
        const medianHeight = median(artifact.pages.map(page => page.documentHeight));
        const captured: Tile[] = artifact.pages.map(page => {
            const warnings: string[] = [];
            if (medianHeight > 0 && page.documentHeight < medianHeight * 0.4) {
                warnings.push("unusually short");
            }
            if (page.warnings?.consentPresent) {
                warnings.push("consent overlay");
            }
            if (page.warnings && page.warnings.brokenImages > 0) {
                warnings.push(`${page.warnings.brokenImages} broken image(s)`);
            }
            return {
                url: page.url,
                label: page.title?.trim() || pathOf(page.url),
                page,
                failed: false,
                warnings
            };
        });
        const failed: Tile[] = artifact.failed.map(url => ({
            url,
            label: pathOf(url),
            page: null,
            failed: true,
            warnings: []
        }));
        // Failed and flagged tiles sort to the top.
        return [...failed, ...captured].sort(
            (a, b) =>
                Number(b.failed || b.warnings.length > 0) -
                Number(a.failed || a.warnings.length > 0)
        );
    }, [artifact]);

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading captured pages…</Text>;
    }
    if (!artifact) {
        return (
            <Text className="p-md text-neutral-strong">Run Capture to produce page images.</Text>
        );
    }

    const flagged = tiles.filter(tile => !tile.failed && tile.warnings.length > 0).length;

    const toggle = (url: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(url)) {
                next.delete(url);
            } else {
                next.add(url);
            }
            return next;
        });

    const exclude = async () => {
        setExcluding(true);
        await presenter.excludeCapturedPages([...selected]);
        setExcluding(false);
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.pages.length} captured · {artifact.failed.length} failed · {flagged}{" "}
                    flagged
                </Text>
                {selected.size > 0 ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        text={excluding ? "Excluding…" : `Exclude ${selected.size} selected`}
                        disabled={excluding}
                        onClick={() => void exclude()}
                    />
                ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-5 gap-sm">
                    {tiles.map(tile => {
                        const isSelected = selected.has(tile.url);
                        return (
                            <div
                                key={tile.url}
                                className={`relative flex flex-col rounded-sm overflow-hidden border ${
                                    isSelected
                                        ? "border-primary-default"
                                        : tile.failed
                                          ? "border-destructive-default"
                                          : tile.warnings.length > 0
                                            ? "border-warning"
                                            : "border-neutral-dimmed"
                                }`}
                            >
                                <label className="absolute top-xxs left-xxs z-10 flex items-center bg-neutral-base/80 rounded-sm p-xxs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggle(tile.url)}
                                    />
                                </label>
                                <div className="aspect-[3/4] bg-neutral-light overflow-hidden">
                                    {tile.page ? (
                                        <RunImage
                                            runId={runId}
                                            imageRef={tile.page.thumbnailRef}
                                            alt={tile.label}
                                            className="w-full h-full object-cover object-top"
                                            onOpen={() => setLightbox(tile.page)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Text size="sm" className="text-destructive-default">
                                                failed
                                            </Text>
                                        </div>
                                    )}
                                </div>
                                <div className="p-xs flex flex-col gap-xxs">
                                    <Text
                                        size="sm"
                                        className="font-medium truncate"
                                        title={tile.url}
                                    >
                                        {tile.label}
                                    </Text>
                                    <Text
                                        size="sm"
                                        className="font-mono truncate text-neutral-strong"
                                    >
                                        {pathOf(tile.url)}
                                    </Text>
                                    <div className="flex flex-wrap gap-xxs">
                                        {tile.failed ? (
                                            <Tag variant="destructive" content="failed" />
                                        ) : tile.warnings.length > 0 ? (
                                            tile.warnings.map(warning => (
                                                <Tag
                                                    key={warning}
                                                    variant="warning"
                                                    content={warning}
                                                />
                                            ))
                                        ) : (
                                            <Tag variant="success-light" content="ok" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {lightbox ? (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-xl cursor-pointer"
                    onClick={() => setLightbox(null)}
                >
                    <div className="max-h-full overflow-y-auto bg-neutral-base rounded-sm">
                        <RunImage
                            runId={runId}
                            imageRef={lightbox.screenshotRef}
                            alt={lightbox.title?.trim() || lightbox.url}
                            className="w-[720px] max-w-full"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
});
