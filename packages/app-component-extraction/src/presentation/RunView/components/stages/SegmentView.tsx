import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { SegmentArtifactDto, SegmentPageDto, SegmentSectionDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// The full-page screenshot spans this document width; section boxes are in the same document space, so
// overlays are positioned as a percentage of it.
const DOCUMENT_WIDTH = 1440;

// A distinct colour per section so adjacent blocks are visually separable. Mid-saturation hues that
// read on top of a screenshot in either theme; they cycle if a page has more sections than colours.
const SECTION_COLORS = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#d97706", // amber
    "#7c3aed", // violet
    "#0891b2", // cyan
    "#db2777", // pink
    "#65a30d" // lime
];
const colorFor = (index: number): string => SECTION_COLORS[index % SECTION_COLORS.length];

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

/**
 * The Segment view (W7.5), read-only. Three panes: a page selector; the full-page screenshot with each
 * detected section drawn as a colour-coded overlay (numbered badge, dimmed when another is focused); and
 * a matching sections list — same colour and number — showing each block's size and its actual crop, so
 * it's clear what every highlighted region is. Hovering a list row or an overlay focuses that section on
 * both. A page whose segmentation collapsed is banner-flagged.
 */
export const SegmentView = createReactiveComponent(function SegmentView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as SegmentArtifactDto | null;
    const runId = vm.run?.id ?? "";
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    // The section (by list position) currently focused via hover, or null.
    const [focused, setFocused] = useState<number | null>(null);

    const medianSections = useMemo(
        () => median((artifact?.pages ?? []).map(page => page.sections.length)),
        [artifact]
    );

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading segmentation…</Text>;
    }
    if (!artifact?.pages?.length) {
        return <Text className="p-md text-neutral-strong">Run Segment to detect sections.</Text>;
    }

    const isOutlier = (page: SegmentPageDto): boolean =>
        page.sections.length <= 1 ||
        (medianSections > 0 && Math.abs(page.sections.length - medianSections) > medianSections);

    const selected = artifact.pages.find(page => page.url === selectedUrl) ?? artifact.pages[0];
    const sections = selected.sections;

    return (
        <div className="flex h-full min-h-0">
            {/* Page selector */}
            <div className="w-[200px] flex-shrink-0 border-r border-neutral-dimmed overflow-y-auto">
                {artifact.pages.map(page => (
                    <div
                        key={page.url}
                        className={`flex items-center justify-between gap-sm px-md py-sm cursor-pointer border-l-2 ${
                            page.url === selected.url
                                ? "border-primary-default bg-neutral-light"
                                : "border-transparent hover:bg-neutral-light"
                        }`}
                        onClick={() => {
                            setSelectedUrl(page.url);
                            setFocused(null);
                        }}
                    >
                        <Text size="sm" className="font-mono truncate">
                            {pathOf(page.url)}
                        </Text>
                        <Tag
                            variant={isOutlier(page) ? "warning" : "neutral-muted"}
                            content={String(page.sections.length)}
                        />
                    </div>
                ))}
            </div>

            {/* Screenshot with colour-coded overlays */}
            <div className="flex-1 min-w-0 overflow-y-auto p-md">
                {isOutlier(selected) ? (
                    <Alert type="warning" variant="subtle" className="mb-md">
                        {`Segmentation may have collapsed: this page has ${sections.length} section(s), far from the run's typical ${medianSections}.`}
                    </Alert>
                ) : null}

                <div className="relative inline-block max-w-full">
                    <RunImage
                        runId={runId}
                        imageRef={selected.screenshotRef}
                        alt={selected.url}
                        className="w-[560px] max-w-full block"
                    />
                    {sections.map((section, i) => {
                        const color = colorFor(i);
                        const isFocused = focused === i;
                        const dimmed = focused !== null && !isFocused;
                        return (
                            <div
                                key={section.index}
                                className="absolute cursor-pointer transition-opacity"
                                style={{
                                    left: `${(section.box.x / DOCUMENT_WIDTH) * 100}%`,
                                    width: `${(section.box.width / DOCUMENT_WIDTH) * 100}%`,
                                    top: `${(section.box.y / selected.documentHeight) * 100}%`,
                                    height: `${(section.box.height / selected.documentHeight) * 100}%`,
                                    border: `${isFocused ? 3 : 2}px solid ${color}`,
                                    backgroundColor: `${color}${isFocused ? "40" : "1f"}`,
                                    opacity: dimmed ? 0.25 : 1
                                }}
                                onMouseEnter={() => setFocused(i)}
                                onMouseLeave={() => setFocused(null)}
                            >
                                <span
                                    className="absolute top-0 left-0 text-neutral-light text-xs font-medium px-xs py-xxs"
                                    style={{ backgroundColor: color }}
                                >
                                    {i + 1}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sections list — matched colour + number, dimensions, and the crop */}
            <div className="w-[280px] flex-shrink-0 border-l border-neutral-dimmed overflow-y-auto">
                <div className="px-md py-sm border-b border-neutral-dimmed">
                    <Text size="sm" className="font-medium">
                        {sections.length} section{sections.length === 1 ? "" : "s"}
                    </Text>
                </div>
                {sections.map((section: SegmentSectionDto, i) => {
                    const color = colorFor(i);
                    const isFocused = focused === i;
                    return (
                        <div
                            key={section.index}
                            className={`flex gap-sm px-md py-sm border-b border-neutral-dimmed cursor-pointer ${
                                isFocused ? "bg-neutral-light" : "hover:bg-neutral-light"
                            }`}
                            onMouseEnter={() => setFocused(i)}
                            onMouseLeave={() => setFocused(null)}
                        >
                            <span
                                className="flex-shrink-0 w-5 h-5 rounded-sm flex items-center justify-center text-neutral-light text-xs font-medium"
                                style={{ backgroundColor: color }}
                            >
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0 flex flex-col gap-xxs">
                                <Text size="sm" className="font-mono text-neutral-strong">
                                    {Math.round(section.box.width)} ×{" "}
                                    {Math.round(section.box.height)}
                                    px
                                </Text>
                                <div className="rounded-sm overflow-hidden border border-neutral-dimmed bg-neutral-light">
                                    {section.cropRef ? (
                                        <RunImage
                                            runId={runId}
                                            imageRef={section.cropRef}
                                            alt={`Section ${i + 1}`}
                                            className="w-full max-h-[120px] object-contain object-top block"
                                        />
                                    ) : (
                                        <Text size="sm" className="p-xs text-neutral-strong">
                                            no crop
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
