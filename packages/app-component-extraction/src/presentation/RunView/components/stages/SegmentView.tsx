import React, { useMemo, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { SegmentArtifactDto, SegmentPageDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// The full-page screenshot spans this document width; section boxes are in the same document space, so
// overlays are positioned as a percentage of it.
const DOCUMENT_WIDTH = 1440;

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
 * The Segment view (W7.5), read-only. A page selector on the left; on the right the full-page screenshot
 * with the detected section boundaries drawn as overlay boxes, each labelled with its index and pixel
 * height. A page whose segmentation collapsed (one section, or a count far from the run median) is
 * banner-flagged rather than silently listed.
 */
export const SegmentView = createReactiveComponent(function SegmentView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as SegmentArtifactDto | null;
    const runId = vm.run?.id ?? "";
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    const medianSections = useMemo(
        () => median((artifact?.pages ?? []).map(page => page.sections.length)),
        [artifact]
    );

    if (vm.artifactLoading && !artifact) {
        return <Text className="p-md text-neutral-strong">Loading segmentation…</Text>;
    }
    if (!artifact || artifact.pages.length === 0) {
        return <Text className="p-md text-neutral-strong">Run Segment to detect sections.</Text>;
    }

    const isOutlier = (page: SegmentPageDto): boolean =>
        page.sections.length <= 1 ||
        (medianSections > 0 && Math.abs(page.sections.length - medianSections) > medianSections);

    const selected = artifact.pages.find(page => page.url === selectedUrl) ?? artifact.pages[0];

    return (
        <div className="flex h-full min-h-0">
            <div className="w-[240px] flex-shrink-0 border-r border-neutral-dimmed overflow-y-auto">
                {artifact.pages.map(page => (
                    <div
                        key={page.url}
                        className={`flex items-center justify-between gap-sm px-md py-sm cursor-pointer border-l-2 ${
                            page.url === selected.url
                                ? "border-primary-default bg-neutral-light"
                                : "border-transparent hover:bg-neutral-light"
                        }`}
                        onClick={() => setSelectedUrl(page.url)}
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

            <div className="flex-1 min-w-0 overflow-y-auto p-md">
                {isOutlier(selected) ? (
                    <Alert type="warning" variant="subtle" className="mb-md">
                        {`Segmentation may have collapsed: this page has ${selected.sections.length} section(s), far from the run's typical ${medianSections}.`}
                    </Alert>
                ) : null}

                <div className="relative inline-block max-w-full">
                    <RunImage
                        runId={runId}
                        imageRef={selected.screenshotRef}
                        alt={selected.url}
                        className="w-[640px] max-w-full block"
                    />
                    {selected.sections.map(section => (
                        <div
                            key={section.index}
                            className="absolute border-2 border-primary-default/80 bg-primary-default/10"
                            style={{
                                left: `${(section.box.x / DOCUMENT_WIDTH) * 100}%`,
                                width: `${(section.box.width / DOCUMENT_WIDTH) * 100}%`,
                                top: `${(section.box.y / selected.documentHeight) * 100}%`,
                                height: `${(section.box.height / selected.documentHeight) * 100}%`
                            }}
                        >
                            <span className="absolute top-0 left-0 bg-primary-default text-neutral-light text-xs px-xxs">
                                {section.index} · {Math.round(section.box.height)}px
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
