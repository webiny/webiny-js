import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import {
    Alert,
    Button,
    Dialog,
    Icon,
    Loader,
    ProgressBar,
    Select,
    Tag,
    Text,
    Tooltip,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import { StatusDot } from "~/presentation/shared/StatusIndicator.js";
import type { RunViewPresenter } from "../abstractions.js";
import type { ThemeSnapshot } from "../themeSnapshot.js";
import type { ThemeFitDto } from "~/shared/types.js";

/**
 * The job's theme, at the foot of the run view's rail: what extraction is doing, what it set, and how well
 * the theme fits what the pipeline measured (theme-in-pipeline-build-plan.md). Success leads with the
 * outcome and keeps its one action quiet; only a failure offers the recovery actions.
 *
 * Review, not a gate: the theme is published automatically, and this is where its risk is made visible.
 * Extraction's confidence is shown, never thresholded (six of six themes said "medium"); thin evidence
 * is flagged where the data supports it; the fit is measured by the pipeline, after Plan.
 */
interface Props {
    presenter: RunViewPresenter.Interface;
}

/** Fewer pages than this is thin evidence: thevibe's theme came from one. */
const THIN_PAGES = 3;

/**
 * How well the theme covers what the pipeline measured.
 *
 * Colours read "matched" and "near" apart: the near count is where the theme and the site differ, the
 * actionable half, and a percentage folds it away. A colour is matched only when its token is the
 * measured colour (themeFit.ts). Until 2026-10-10 the fit counted any token found and read 57 of 57 on
 * a run with five sections the wrong colour, so a fit without `near` (an API from before then) is not
 * shown at all: a number wrong in the flattering direction is worse than none.
 */
const FitLine = ({ fit }: { fit: ThemeFitDto }) => {
    if (fit.colours.near === undefined) {
        return null;
    }
    const rows = [
        {
            label: "Colours",
            ...fit.colours,
            text: `${fit.colours.fitted} of ${fit.colours.measured} matched, ${fit.colours.near} near`
        },
        {
            label: "Type",
            ...fit.typeSizes,
            text: `${fit.typeSizes.fitted} of ${fit.typeSizes.measured} matched`
        },
        {
            label: "Spacing",
            ...fit.spacing,
            text: `${fit.spacing.fitted} of ${fit.spacing.measured} matched`
        }
    ];
    return (
        <Section label="Fits what was measured">
            {rows.map(row => (
                <div key={row.label} className="flex flex-col">
                    <div className="flex items-baseline justify-between gap-xs">
                        <Text size="sm">{row.label}</Text>
                        <Text size="sm" className="text-neutral-strong">
                            {row.text}
                        </Text>
                    </div>
                    {/* Matched only: "near" is said in words, a second bar segment has no primitive. */}
                    {/* Neutral, not the brand colour: a fit is a measurement, not a task part done. */}
                    <ProgressBar
                        value={row.fitted}
                        max={Math.max(row.measured, 1)}
                        className="[&_[data-slot=progress-indicator]]:bg-neutral-strong"
                    />
                </div>
            ))}
            <Text size="sm" className="text-neutral-muted">
                Matched: the theme has the colour the site uses. Near: it has one close to it, not
                it.
            </Text>
        </Section>
    );
};

/** One block of the card, under a small uppercase label. */
const Section = ({
    label,
    aside,
    children
}: {
    label: string;
    aside?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-sm border-t border-neutral-dimmed px-md py-sm-extra">
        <div className="flex items-baseline justify-between gap-xs">
            <Text size="sm" className="font-semibold uppercase tracking-wider text-neutral-muted">
                {label}
            </Text>
            {aside}
        </div>
        {children}
    </div>
);

/**
 * What extraction set, at a glance: the colours its slots resolve to and the type sizes it measured.
 *
 * Only what extraction changed from the default theme is shown (see `themeSnapshot`), and it is labelled
 * as what was set, not as coverage: how much of the site the theme covers is the fit line beneath it,
 * where spacing has run 8-21%. A full-looking palette must not read as a stronger claim than that.
 */
const Snapshot = ({ snapshot }: { snapshot: ThemeSnapshot | null }) => {
    // Null while the theme loads, or if it could not be: nothing is said rather than a guess.
    if (!snapshot) {
        return null;
    }
    const fontLine = snapshot?.font
        ? snapshot.font.extracted
            ? `Font: ${snapshot.font.family}`
            : `Font not extracted (default ${snapshot.font.family})`
        : null;
    return (
        <>
            <Section label="Colours">
                {snapshot.colours.length === 0 ? (
                    <Text size="sm" className="text-neutral-strong">
                        No colour slot differs from the default theme, so none is shown as set from
                        the site.
                    </Text>
                ) : (
                    <>
                        <div className="grid grid-cols-5 gap-xs">
                            {snapshot.colours.map(colour => (
                                <Tooltip
                                    key={colour.value}
                                    content={colour.slots
                                        .map(slot => slot.replace(/^color\./, ""))
                                        .join(", ")}
                                    trigger={
                                        <div className="flex min-w-0 cursor-default flex-col gap-xs">
                                            {/* The colour itself is the data: the one inline style. */}
                                            <div
                                                className="h-xl rounded-md border border-neutral-dimmed"
                                                style={{ backgroundColor: colour.value }}
                                            />
                                            {/* The design's 10.5px mono: below the smallest Text size, so the one sized span. */}
                                            <span className="truncate font-mono text-[10.5px] leading-tight text-neutral-muted">
                                                {colour.value.toUpperCase()}
                                            </span>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                        <Text size="sm" className="text-neutral-strong">
                            Colours set from the site.
                        </Text>
                    </>
                )}
            </Section>
            {snapshot.sizes.length > 0 || fontLine ? (
                <Section
                    label="Type"
                    aside={
                        fontLine ? (
                            <Text
                                size="sm"
                                className="truncate text-neutral-muted"
                                title={fontLine}
                            >
                                {fontLine}
                            </Text>
                        ) : null
                    }
                >
                    <div className="flex flex-col">
                        {snapshot.sizes.map(({ label, size }) => (
                            <div
                                key={label}
                                className="flex items-baseline justify-between gap-xs border-b border-dotted border-neutral-dimmed py-xxs"
                            >
                                {/* Real size, capped by the rail's width rather than scaled down. */}
                                <span
                                    className="min-w-0 truncate leading-tight"
                                    style={{
                                        fontSize: size,
                                        fontWeight: label === "Body" ? 400 : 600
                                    }}
                                >
                                    {label === "Body" ? "The quick brown fox" : "Heading"}
                                </span>
                                <Text
                                    size="sm"
                                    className="flex-shrink-0 font-mono text-neutral-muted"
                                >
                                    {label} {size}
                                </Text>
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}
        </>
    );
};

export const ThemeCard = createReactiveComponent(({ presenter }: Props) => {
    const { vm } = presenter;
    const job = vm.job;
    const toast = useToast();
    const [confirmRetry, setConfirmRetry] = useState(false);
    const [picking, setPicking] = useState(false);
    const [picked, setPicked] = useState("");
    const [showUncertain, setShowUncertain] = useState(false);

    if (!job) {
        return null;
    }
    const extraction = job.themeExtraction;

    const run = async (action: () => Promise<void>, failure: string) => {
        try {
            await action();
        } catch (error) {
            toast.showWarningToast({ title: failure, description: (error as Error).message });
        }
    };

    const openPicker = () => {
        setPicking(true);
        void run(() => presenter.loadThemeChoices(), "Could not load themes");
    };

    const picker = picking ? (
        <div className="flex flex-col gap-xs">
            <Select
                label="Existing theme"
                value={picked}
                onChange={(value: string) => setPicked(value)}
                placeholder="Select a published theme"
                options={vm.themeChoices.map(theme => ({
                    label: `${theme.name} (v${theme.version})`,
                    value: theme.id
                }))}
            />
            <div className="flex gap-xs">
                <Button
                    size="sm"
                    text="Use this theme"
                    disabled={!picked || vm.themeBusy}
                    onClick={() =>
                        run(async () => {
                            await presenter.useExistingTheme(picked);
                            setPicking(false);
                        }, "Could not pin the theme")
                    }
                />
                <Button
                    size="sm"
                    variant="tertiary"
                    text="Cancel"
                    onClick={() => setPicking(false)}
                />
            </div>
        </div>
    ) : null;

    const retryButton = (
        <Button
            size="sm"
            variant="secondary"
            text="Retry extraction"
            disabled={vm.themeBusy}
            onClick={() =>
                // On a theme that already works, re-extracting replaces it: confirm first.
                extraction?.status === "done"
                    ? setConfirmRetry(true)
                    : run(() => presenter.retryTheme(), "Could not retry the extraction")
            }
        />
    );

    return (
        <div className="flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-dimmed bg-neutral-base shadow-sm">
            <div className="flex flex-col gap-xs px-md py-sm-extra">
                <div className="flex items-center justify-between gap-xs">
                    <Text size="lg" className="font-semibold text-neutral-primary">
                        Theme
                    </Text>
                    {extraction?.status === "done" && extraction.themeVersion ? (
                        <Tag variant="neutral-light" content={`v${extraction.themeVersion}`} />
                    ) : null}
                </div>
                {extraction?.status === "done" ? (
                    <div className="flex items-center gap-xs">
                        <StatusDot status="complete" />
                        <Text size="sm" className="text-neutral-strong">
                            Extracted from the site
                        </Text>
                    </div>
                ) : null}
            </div>

            {!extraction ? (
                <Text size="sm" className="px-md pb-sm-extra text-neutral-strong">
                    {job.themeEntryId
                        ? `Pinned when the job was created (v${job.themeVersion}).`
                        : "No theme yet."}
                </Text>
            ) : extraction.status === "running" || extraction.status === "waiting" ? (
                <div className="flex flex-col gap-xs px-md pb-sm-extra">
                    <div className="flex items-center gap-xs">
                        <Loader size="sm" />
                        <Text size="sm">Extracting from the site</Text>
                    </div>
                    <Text size="sm" className="text-neutral-strong">
                        {extraction.step || "starting"}
                    </Text>
                    <Text size="sm" className="text-neutral-muted">
                        Discover, Capture and Segment can run meanwhile; Cluster opens once the
                        theme is published.
                    </Text>
                </div>
            ) : extraction.status === "failed" ? (
                <div className="flex flex-col gap-sm px-md pb-sm-extra">
                    <Alert type="danger">
                        The theme could not be extracted: {extraction.error ?? "no reason recorded"}
                    </Alert>
                    <div className="flex flex-wrap gap-xs">
                        {retryButton}
                        <Button
                            size="sm"
                            variant="tertiary"
                            text="Use an existing theme"
                            onClick={openPicker}
                        />
                    </div>
                    {picker}
                </div>
            ) : (
                <div className="flex flex-col">
                    <Snapshot snapshot={vm.themeSnapshot} />
                    {vm.themeFit ? <FitLine fit={vm.themeFit} /> : null}

                    <div className="flex flex-col gap-sm border-t border-neutral-dimmed px-md py-sm-extra">
                        {extraction.pagesSampled < THIN_PAGES || extraction.confidence === "low" ? (
                            <Alert type="warning">
                                Thin evidence:{" "}
                                {extraction.pagesSampled < THIN_PAGES
                                    ? `the theme was read from ${extraction.pagesSampled} page${extraction.pagesSampled === 1 ? "" : "s"}`
                                    : "extraction reported low confidence"}
                                . Check it before relying on it.
                            </Alert>
                        ) : null}

                        <div className="flex flex-wrap gap-xxs">
                            <Tag
                                variant="neutral-light"
                                content={`Confidence ${extraction.confidence ?? "not reported"}`}
                            />
                            <Tag
                                variant="neutral-light"
                                content={`${extraction.pagesSampled} page${extraction.pagesSampled === 1 ? "" : "s"} sampled`}
                            />
                            <Tag
                                variant="neutral-light"
                                content={`${extraction.slotsApplied} tokens`}
                            />
                        </div>

                        {/*
                         * Every theme extracted so far reports 9 or 10 of these, so they are the normal
                         * state, not a warning queue: notes, collapsed.
                         */}
                        {extraction.uncertain.length > 0 ? (
                            <div className="flex flex-col gap-xxs">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full justify-start"
                                    icon={<InfoIcon />}
                                    text={
                                        <span className="flex flex-1 items-center justify-between gap-xs">
                                            {`${extraction.uncertain.length} note${extraction.uncertain.length === 1 ? "" : "s"}`}
                                            <Icon
                                                icon={
                                                    showUncertain ? (
                                                        <ExpandLessIcon />
                                                    ) : (
                                                        <ExpandMoreIcon />
                                                    )
                                                }
                                                label={showUncertain ? "Hide notes" : "Show notes"}
                                                size="sm"
                                                color="neutral-light"
                                            />
                                        </span>
                                    }
                                    onClick={() => setShowUncertain(!showUncertain)}
                                />
                                {showUncertain ? (
                                    <ul className="m-0 flex list-disc flex-col gap-xxs pl-md">
                                        {extraction.uncertain.map((item, index) => (
                                            <li key={index}>
                                                <Text size="sm">
                                                    {item.path ? (
                                                        <span className="font-medium">
                                                            {item.path}:{" "}
                                                        </span>
                                                    ) : null}
                                                    {item.reason}
                                                </Text>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : null}

                        {/* Quiet: it re-pins and marks Cluster onward stale, so it is not an invitation. */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="self-start"
                            text="Retry extraction"
                            icon={<RefreshIcon />}
                            disabled={vm.themeBusy}
                            onClick={() => setConfirmRetry(true)}
                        />
                    </div>
                </div>
            )}

            {extraction?.status !== "done" && vm.themeFit ? <FitLine fit={vm.themeFit} /> : null}

            {confirmRetry ? (
                <Dialog
                    open={true}
                    onOpenChange={open => {
                        if (!open) {
                            setConfirmRetry(false);
                        }
                    }}
                    size="sm"
                    title="Extract the theme again?"
                    actions={
                        <>
                            <Dialog.CancelAction text="Cancel" />
                            <Dialog.ConfirmAction
                                text="Extract again"
                                onClick={() => {
                                    setConfirmRetry(false);
                                    void run(
                                        () => presenter.retryTheme(),
                                        "Could not retry the extraction"
                                    );
                                }}
                            />
                        </>
                    }
                >
                    <Text size="sm">
                        The site is read again and a new theme published and pinned. Cluster and
                        every stage after it in this run become stale and need re-running. The
                        current theme stays in the Theme app.
                    </Text>
                </Dialog>
            ) : null}
        </div>
    );
});
