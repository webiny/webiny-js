import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Loader, Scrollbar, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { AssembledPageDto, ComposedPageDto } from "~/shared/types.js";
import { PageSignals } from "./PageSignals.js";
import { composedStatus, type ComposedStatus } from "./pageStatus.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const STATUS_TAG: Record<ComposedStatus, { content: string; variant: string }> = {
    composed: { content: "composed", variant: "success-light" },
    caveat: { content: "composed, with a caveat", variant: "warning" },
    failed: { content: "failed", variant: "destructive" },
    unknown: { content: "composed, unmeasured", variant: "neutral-light" }
};

const pathOf = (url: string): string => {
    try {
        return new URL(url).pathname || "/";
    } catch {
        return url;
    }
};

/**
 * The composed pages of a run, and the comparison of one against its source.
 *
 * Composition runs outside the nine-stage pipeline — no ledger entry, no stage version, no staleness
 * — so this is a panel beside the stage views rather than a tenth stage, in the same place Overrides
 * and Token usage sit.
 */
export const ComposedPagesPanel = createReactiveComponent(function ComposedPagesPanel({
    presenter
}: Props) {
    const { vm } = presenter;
    const runId = vm.run?.id ?? "";
    const map = vm.pageMap;

    if (vm.pageMapLoading && !map) {
        return (
            <div className="flex flex-1 items-center justify-center p-xl">
                <Loader />
            </div>
        );
    }

    if (!map) {
        return (
            <div className="p-md">
                <Text className="text-neutral-strong">
                    This run has not been composed. Composition is a separate step from the pipeline
                    — run it to produce Website Builder pages from this run&apos;s components.
                </Text>
            </div>
        );
    }

    const assembledByUrl = new Map<string, AssembledPageDto>(
        (vm.composedAssemble?.pages ?? []).map(page => [page.url, page])
    );
    const compared = map.pages.find(page => page.path === vm.comparedPath) ?? null;

    if (compared) {
        return (
            <Comparison
                runId={runId}
                page={compared}
                assembled={assembledByUrl.get(compared.sourceUrl)}
                onBack={() => presenter.comparePage(null)}
            />
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
                <Text size="sm" className="text-neutral-strong">
                    {map.pages.length} composed · {map.failed.length} failed · {map.links.rewritten}{" "}
                    destinations rewritten · {map.links.dropped} dropped
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    composed {new Date(map.composedOn).toLocaleString()}
                </Text>
            </div>

            <Scrollbar>
                <div className="flex flex-col gap-xs p-md">
                    {map.pages.map(page => {
                        const status = composedStatus(page);
                        const tag = STATUS_TAG[status];
                        const signals = page.signals;
                        return (
                            <div
                                key={page.path}
                                className="flex items-center gap-md rounded-sm border border-neutral-dimmed px-sm py-xs"
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                                    <Text className="truncate font-medium" title={page.title}>
                                        {page.title || page.path}
                                    </Text>
                                    <Text
                                        size="sm"
                                        className="truncate font-mono text-neutral-strong"
                                        title={`${page.sourceUrl} → ${page.path}`}
                                    >
                                        {pathOf(page.sourceUrl)} → {page.path}
                                    </Text>
                                </div>

                                <div className="flex w-[7rem] flex-shrink-0 flex-col gap-xxs">
                                    <Text size="sm" className="text-neutral-strong">
                                        {signals
                                            ? `${signals.composedInstances} of ${signals.sourceSections}`
                                            : "—"}
                                    </Text>
                                    <Text size="sm" className="text-neutral-strong">
                                        instances
                                    </Text>
                                </div>

                                <div className="flex w-[13rem] flex-shrink-0 flex-col gap-xxs">
                                    <Text size="sm" className="text-neutral-strong">
                                        {signals
                                            ? `${signals.links.rewritten} rewritten · ${signals.links.external} external`
                                            : "—"}
                                    </Text>
                                    <Text size="sm" className="text-neutral-strong">
                                        {signals
                                            ? `${signals.links.recovered} recovered · ${signals.links.dropped} dropped`
                                            : ""}
                                    </Text>
                                </div>

                                <div className="w-[12rem] flex-shrink-0">
                                    <Tag variant={tag.variant as never} content={tag.content} />
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-xs">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        text="Compare"
                                        onClick={() => presenter.comparePage(page.path)}
                                    />
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        text="Open"
                                        onClick={() =>
                                            window.open(
                                                `/website-builder/pages?id=${encodeURIComponent(page.pageId)}`,
                                                "_blank",
                                                "noopener"
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {map.failed.map(failure => (
                        <div
                            key={failure.sourceUrl}
                            className="flex flex-col gap-xxs rounded-sm border border-destructive-default px-sm py-xs"
                        >
                            <Text className="truncate font-mono" title={failure.sourceUrl}>
                                {pathOf(failure.sourceUrl)}
                            </Text>
                            <Text size="sm" className="text-destructive-default">
                                {failure.reason}
                            </Text>
                        </div>
                    ))}
                </div>
            </Scrollbar>
        </div>
    );
});

/**
 * One page against its source.
 *
 * Side by side rather than an overlay or a slider: the two pages differ in height, and a slider makes
 * that difference the most prominent thing on screen when it is the least informative. The composed
 * image is absent until there is a website to screenshot — the pages are published data, but nothing
 * in this project serves them, so there is no page to photograph.
 */
const Comparison = ({
    runId,
    page,
    assembled,
    onBack
}: {
    runId: string;
    page: ComposedPageDto;
    assembled?: AssembledPageDto;
    onBack: () => void;
}) => (
    <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between gap-sm border-b border-neutral-dimmed px-md py-sm">
            <div className="flex min-w-0 flex-col gap-xxs">
                <Text className="truncate font-medium">{page.title || page.path}</Text>
                <Text size="sm" className="truncate font-mono text-neutral-strong">
                    {page.sourceUrl} → {page.path}
                </Text>
            </div>
            <Button variant="tertiary" size="sm" text="Back to the list" onClick={onBack} />
        </div>

        <Scrollbar>
            <div className="flex flex-col gap-md p-md">
                <PageSignals signals={page.signals} />

                <div className="grid grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xxs">
                        <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
                            Source
                        </Text>
                        {assembled?.screenshotRef ? (
                            <RunImage
                                runId={runId}
                                imageRef={assembled.screenshotRef}
                                alt={`${page.sourceUrl} as captured`}
                                className="w-full rounded-sm border border-neutral-dimmed"
                            />
                        ) : (
                            <Text size="sm" className="text-neutral-strong">
                                No capture screenshot for this page.
                            </Text>
                        )}
                    </div>

                    <div className="flex flex-col gap-xxs">
                        <Text size="sm" className="uppercase tracking-wide text-neutral-strong">
                            Composed
                        </Text>
                        <div className="flex min-h-[12rem] flex-col justify-center gap-xs rounded-sm border border-dashed border-neutral-muted p-md">
                            <Text size="sm" className="text-neutral-strong">
                                No image yet. The composed pages are published Website Builder
                                pages, but this project has no website app deployed to serve them,
                                so there is nothing to screenshot.
                            </Text>
                            <Text size="sm" className="text-neutral-strong">
                                The signals above are measured from the page&apos;s own document and
                                do not depend on an image.
                            </Text>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-xs">
                    <Text className="font-medium">
                        Instances in document order
                        {assembled ? ` (${assembled.instances.length})` : ""}
                    </Text>
                    {(assembled?.instances ?? []).map((instance, index) => {
                        const unplaced = page.signals?.unplaced.some(item => item.index === index);
                        return (
                            <div
                                key={`${instance.signature}-${index}`}
                                className={`flex flex-col gap-xxs rounded-sm border px-sm py-xs ${
                                    unplaced
                                        ? "border-warning bg-warning-subtle"
                                        : "border-neutral-dimmed"
                                }`}
                            >
                                <div className="flex items-center gap-sm">
                                    <Text className="font-medium">{instance.componentName}</Text>
                                    {unplaced ? (
                                        <Tag
                                            variant="warning"
                                            content="not composed — no promoted component"
                                        />
                                    ) : null}
                                </div>
                                {Object.entries(instance.propValues ?? {}).map(([name, value]) => (
                                    <Text
                                        key={name}
                                        size="sm"
                                        className="break-words text-neutral-strong"
                                    >
                                        <span className="font-mono">{name}</span>: {String(value)}
                                    </Text>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Scrollbar>
    </div>
);
