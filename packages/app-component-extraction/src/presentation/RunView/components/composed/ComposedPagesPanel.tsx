import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Loader, Scrollbar, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type { AssembledPageDto, ComposedPageDto } from "~/shared/types.js";
import { PageSignals } from "./PageSignals.js";
import { composedStatus, type ComposedStatus } from "./pageStatus.js";
import {
    captureState,
    pageCapture,
    provenance,
    type CaptureState,
    type PageCapture
} from "./captureState.js";

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
 *
 * The composed screenshots are uploaded by a developer running a local harness, so having none is the
 * resting state of every run and the view says so in those words. What it must never do is let an
 * absent or out-of-date composed half read as a migration failure.
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

    const state = captureState(map, vm.composedCapture);
    const capture = state.kind === "absent" ? null : state.capture;

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
                state={state}
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

            <CaptureBanner state={state} />

            <Scrollbar>
                <div className="flex flex-col gap-xs p-md">
                    {map.pages.map(page => {
                        const status = composedStatus(page);
                        const tag = STATUS_TAG[status];
                        const signals = page.signals;
                        const composed = pageCapture(capture, page.path);
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

                                <div className="w-[9rem] flex-shrink-0">
                                    <ScreenshotIndicator state={state} composed={composed} />
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
 * Whether the run has composed screenshots at all, stated once above the list.
 *
 * Said at the top rather than only per page, because "nobody has run the harness" is a fact about the
 * run and repeating it on every row would read as ten separate faults.
 */
const CaptureBanner = ({ state }: { state: CaptureState }) => {
    if (state.kind === "absent") {
        return (
            <div className="flex flex-col gap-xxs border-b border-neutral-dimmed bg-neutral-light px-md py-sm">
                <Text size="sm" className="font-medium">
                    No composed screenshots for this run — nobody has run the comparison harness.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    The signals below are measured from each page&apos;s own document and do not
                    need one. Photographing a composed page needs a browser rendering the migrated
                    site, which is a local step until the website app can be deployed.
                </Text>
            </div>
        );
    }

    if (state.kind === "stale") {
        return (
            <div className="flex flex-col gap-xxs border-b border-warning bg-warning-subtle px-md py-sm">
                <div className="flex items-center gap-sm">
                    <Tag variant="warning" content="stale" />
                    <Text size="sm" className="font-medium">
                        The composed screenshots are of composition {state.captured}; this run is
                        now at {state.composed}.
                    </Text>
                </div>
                <Text size="sm" className="text-neutral-strong">
                    {provenance(state.capture)} They are still shown, marked, because a screenshot
                    of the previous composition is evidence about a page that has since been rebuilt
                    — not the same thing as having none.
                </Text>
            </div>
        );
    }

    return (
        <div className="border-b border-neutral-dimmed px-md py-xs">
            <Text size="sm" className="text-neutral-strong">
                {provenance(state.capture)}
            </Text>
        </div>
    );
};

/** Per row: whether this page has a composed screenshot, and if not, that there is a reason to read. */
const ScreenshotIndicator = ({
    state,
    composed
}: {
    state: CaptureState;
    composed: PageCapture;
}) => {
    if (state.kind === "absent") {
        return (
            <Text size="sm" className="text-neutral-strong">
                no screenshot
            </Text>
        );
    }
    if (composed.kind === "captured") {
        return (
            <Tag
                variant={(state.kind === "stale" ? "warning" : "success-light") as never}
                content={state.kind === "stale" ? "screenshot, stale" : "screenshot"}
            />
        );
    }
    return (
        <Tag
            variant={"neutral-light" as never}
            content={composed.kind === "skipped" ? "skipped" : "not captured"}
        />
    );
};

/**
 * One page against its source.
 *
 * Side by side rather than an overlay or a slider: the two pages differ in height, and a slider makes
 * that difference the most prominent thing on screen when it is the least informative. There is
 * deliberately no similarity score — the signals measure the page's content and the screenshots show
 * its appearance, and the value of having both is precisely that they disagree. That disagreement has
 * already earned its keep three times: the signals read healthy on pages that rendered nothing, again
 * on pages returning 500, and again on a contact page that scored 5 of 5 while being visibly a
 * different page.
 */
const Comparison = ({
    runId,
    page,
    assembled,
    state,
    onBack
}: {
    runId: string;
    page: ComposedPageDto;
    assembled?: AssembledPageDto;
    state: CaptureState;
    onBack: () => void;
}) => {
    const capture = state.kind === "absent" ? null : state.capture;
    const composed = pageCapture(capture, page.path);

    return (
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
                    {state.kind === "stale" ? <StaleNotice state={state} /> : null}

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
                                {state.kind === "stale"
                                    ? ` · from composition ${state.captured}`
                                    : ""}
                            </Text>
                            {composed.kind === "captured" ? (
                                <RunImage
                                    runId={runId}
                                    imageRef={composed.screenshotRef}
                                    source="composed"
                                    alt={`${page.path} as composed`}
                                    className={`w-full rounded-sm border ${
                                        state.kind === "stale"
                                            ? "border-warning"
                                            : "border-neutral-dimmed"
                                    }`}
                                />
                            ) : (
                                <ComposedAbsent state={state} composed={composed} />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-xs">
                        <Text className="font-medium">
                            Instances in document order
                            {assembled ? ` (${assembled.instances.length})` : ""}
                        </Text>
                        {(assembled?.instances ?? []).map((instance, index) => {
                            const unplaced = page.signals?.unplaced.some(
                                item => item.index === index
                            );
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
                                        <Text className="font-medium">
                                            {instance.componentName}
                                        </Text>
                                        {unplaced ? (
                                            <Tag
                                                variant="warning"
                                                content="not composed — no promoted component"
                                            />
                                        ) : null}
                                    </div>
                                    {Object.entries(instance.propValues ?? {}).map(
                                        ([name, value]) => (
                                            <Text
                                                key={name}
                                                size="sm"
                                                className="break-words text-neutral-strong"
                                            >
                                                <span className="font-mono">{name}</span>:{" "}
                                                {String(value)}
                                            </Text>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Scrollbar>
        </div>
    );
};

/**
 * The composed half, when there is no image for this page.
 *
 * Three different sentences, because three different things have happened and an operator acts on
 * each differently: nobody has run the capture, the harness ran and could not render this page, or
 * the capture is older than this page. A single "no image" placeholder for all three is what this
 * view used to show, and it made the normal state indistinguishable from a defect.
 */
const ComposedAbsent = ({ state, composed }: { state: CaptureState; composed: PageCapture }) => (
    <div className="flex min-h-[12rem] flex-col justify-center gap-xs rounded-sm border border-dashed border-neutral-muted p-md">
        {state.kind === "absent" ? (
            <>
                <Text size="sm" className="font-medium">
                    No composed capture exists for this run.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    Nobody has run the comparison harness for it. Photographing a composed page
                    needs a browser rendering the migrated site, and the website app links an
                    unpublished SDK, so it cannot be deployed and nothing here can take the picture
                    on its own.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    The signals above are measured from the page&apos;s own document and do not
                    depend on an image.
                </Text>
            </>
        ) : composed.kind === "skipped" ? (
            <>
                <Text size="sm" className="font-medium">
                    The harness could not photograph this page.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    {composed.reason}
                </Text>
            </>
        ) : state.kind === "stale" ? (
            <>
                <Text size="sm" className="font-medium">
                    This page is not in the capture.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    The capture was taken against composition {state.captured} and this page comes
                    from composition {state.composed} — it did not exist when the screenshots were
                    taken. Re-run the harness to include it.
                </Text>
            </>
        ) : (
            <>
                <Text size="sm" className="font-medium">
                    The capture does not mention this page.
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    It is of this composition, so the page should be in it either photographed or
                    skipped with a reason. That it is in neither list is a gap in the harness rather
                    than a fact about the page — said plainly instead of shown as a missing image.
                </Text>
            </>
        )}
    </div>
);

/** Both versions named, so "stale" is a fact an operator can check rather than a warning to trust. */
const StaleNotice = ({ state }: { state: Extract<CaptureState, { kind: "stale" }> }) => (
    <div className="flex flex-col gap-xxs rounded-sm border border-warning bg-warning-subtle px-sm py-xs">
        <div className="flex items-center gap-sm">
            <Tag variant="warning" content="stale comparison" />
            <Text size="sm" className="font-medium">
                These screenshots are of composition {state.captured}. This run is now at{" "}
                {state.composed}.
            </Text>
        </div>
        <Text size="sm" className="text-neutral-strong">
            {provenance(state.capture)} The pages have been composed again since, so the composed
            half below may differ from what the signals describe. Re-run the harness to refresh it.
        </Text>
    </div>
);
