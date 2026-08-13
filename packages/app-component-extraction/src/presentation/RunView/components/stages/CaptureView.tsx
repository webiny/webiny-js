import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tag, Text } from "@webiny/admin-ui";
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
    page: CapturePageDto | null;
    failed: boolean;
    /** A warning flag from data capture already has (short page relative to the run median). */
    warning: string | null;
}

/**
 * The Capture view (W7.4). A thumbnail grid of the captured pages, five across, with failed pages and
 * flagged pages (unusually short relative to the run median) sorted to the top. Opening a tile shows the
 * full-page screenshot.
 */
export const CaptureView = createReactiveComponent(function CaptureView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as CaptureArtifactDto | null;
    const runId = vm.run?.id ?? "";
    const [lightbox, setLightbox] = useState<CapturePageDto | null>(null);

    const tiles = useMemo<Tile[]>(() => {
        if (!artifact) {
            return [];
        }
        const medianHeight = median(artifact.pages.map(page => page.documentHeight));
        const captured: Tile[] = artifact.pages.map(page => ({
            url: page.url,
            page,
            failed: false,
            warning:
                medianHeight > 0 && page.documentHeight < medianHeight * 0.4
                    ? "unusually short page"
                    : null
        }));
        const failed: Tile[] = artifact.failed.map(url => ({
            url,
            page: null,
            failed: true,
            warning: null
        }));
        // Failed and flagged tiles sort to the top.
        return [...failed, ...captured].sort(
            (a, b) => Number(b.failed || !!b.warning) - Number(a.failed || !!a.warning)
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

    const flagged = tiles.filter(tile => tile.warning).length;

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Text size="sm" className="text-neutral-strong">
                    {artifact.pages.length} captured · {artifact.failed.length} failed · {flagged}{" "}
                    flagged
                </Text>
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="grid grid-cols-5 gap-sm">
                    {tiles.map(tile => (
                        <div
                            key={tile.url}
                            className={`flex flex-col rounded-sm overflow-hidden border ${
                                tile.failed
                                    ? "border-destructive-default"
                                    : tile.warning
                                      ? "border-warning"
                                      : "border-neutral-dimmed"
                            }`}
                        >
                            <div className="aspect-[3/4] bg-neutral-light overflow-hidden">
                                {tile.page ? (
                                    <RunImage
                                        runId={runId}
                                        imageRef={tile.page.thumbnailRef}
                                        alt={tile.url}
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
                                <Text size="sm" className="font-mono truncate">
                                    {pathOf(tile.url)}
                                </Text>
                                {tile.failed ? (
                                    <Tag variant="destructive" content="failed" />
                                ) : tile.warning ? (
                                    <Tag variant="warning" content={tile.warning} />
                                ) : (
                                    <Tag variant="success-light" content="ok" />
                                )}
                            </div>
                        </div>
                    ))}
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
                            alt={lightbox.url}
                            className="w-[720px] max-w-full"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
});
