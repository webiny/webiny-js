import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Dialog, Loader, Select, Text, useToast } from "@webiny/admin-ui";
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

const percent = (count: { fitted: number; measured: number }) =>
    count.measured ? `${Math.round((100 * count.fitted) / count.measured)}%` : "none measured";

const FitLine = ({ fit }: { fit: ThemeFitDto }) => (
    <div className="flex flex-col gap-xxs">
        <Text size="sm" className="font-medium">
            Fits what was measured
        </Text>
        <Text size="sm" className="text-neutral-strong">
            Colours {percent(fit.colours)} · type {percent(fit.typeSizes)} · spacing{" "}
            {percent(fit.spacing)}
        </Text>
        <Text size="sm" className="text-neutral-muted">
            Of the colours, type sizes and spacing measured on the site, how many the theme has a
            token for. {fit.misses.length} without one.
        </Text>
    </div>
);

/**
 * What extraction set, at a glance: the colours its slots resolve to and the type sizes it measured.
 *
 * Only what extraction changed from the default theme is shown (see `themeSnapshot`), and it is labelled
 * as what was set, not as coverage: how much of the site the theme covers is the fit line beneath it,
 * where spacing has run 8-21%. A full-looking palette must not read as a stronger claim than that.
 */
const Snapshot = ({ snapshot }: { snapshot: ThemeSnapshot }) => {
    if (snapshot.colours.length === 0 && snapshot.sizes.length === 0) {
        return null;
    }
    return (
        <div className="flex flex-col gap-xs">
            {snapshot.colours.length > 0 ? (
                <div className="flex flex-col gap-xxs">
                    <div className="flex flex-wrap gap-xxs">
                        {snapshot.colours.map(colour => (
                            <span
                                key={colour.value}
                                className="size-6 rounded-sm border border-neutral-dimmed"
                                style={{ backgroundColor: colour.value }}
                                title={`${colour.value} · ${colour.slots.map(slot => slot.replace(/^color\./, "")).join(", ")}`}
                            />
                        ))}
                    </div>
                    <Text size="sm" className="text-neutral-muted">
                        Colours set from the site
                    </Text>
                </div>
            ) : null}
            {snapshot.sizes.length > 0 || snapshot.font ? (
                <Text size="sm" className="text-neutral-strong">
                    {snapshot.sizes.map(({ label, size }) => `${label} ${size}`).join(" · ")}
                    {snapshot.font && !snapshot.font.extracted
                        ? `${snapshot.sizes.length > 0 ? " · " : ""}font not extracted (default ${snapshot.font.family})`
                        : snapshot.font
                          ? `${snapshot.sizes.length > 0 ? " · " : ""}${snapshot.font.family}`
                          : ""}
                </Text>
            ) : null}
        </div>
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
        <div className="mt-md flex flex-col gap-sm rounded-md border border-neutral-dimmed p-sm">
            <Text className="font-medium">Theme</Text>

            {!extraction ? (
                <Text size="sm" className="text-neutral-strong">
                    {job.themeEntryId
                        ? `Pinned when the job was created (v${job.themeVersion}).`
                        : "No theme yet."}
                </Text>
            ) : extraction.status === "running" || extraction.status === "waiting" ? (
                <div className="flex flex-col gap-xs">
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
                <div className="flex flex-col gap-sm">
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
                <div className="flex flex-col gap-sm">
                    <div className="flex items-center gap-xs">
                        <StatusDot status="complete" />
                        <Text size="sm" className="font-medium">
                            Extracted from the site
                            {extraction.themeVersion ? ` · v${extraction.themeVersion}` : ""}
                        </Text>
                    </div>

                    {vm.themeSnapshot ? <Snapshot snapshot={vm.themeSnapshot} /> : null}
                    {vm.themeFit ? <FitLine fit={vm.themeFit} /> : null}

                    {extraction.pagesSampled < THIN_PAGES || extraction.confidence === "low" ? (
                        <Alert type="warning">
                            Thin evidence:{" "}
                            {extraction.pagesSampled < THIN_PAGES
                                ? `the theme was read from ${extraction.pagesSampled} page${extraction.pagesSampled === 1 ? "" : "s"}`
                                : "extraction reported low confidence"}
                            . Check it before relying on it.
                        </Alert>
                    ) : null}

                    <Text size="sm" className="text-neutral-muted">
                        Confidence {extraction.confidence ?? "not reported"} ·{" "}
                        {extraction.pagesSampled} page{extraction.pagesSampled === 1 ? "" : "s"} ·{" "}
                        {extraction.slotsApplied} tokens
                    </Text>

                    {/*
                     * Every theme extracted so far reports 9 or 10 of these, so they are the normal
                     * state, not a warning queue: notes, collapsed.
                     */}
                    {extraction.uncertain.length > 0 ? (
                        <div className="flex flex-col gap-xxs">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="self-start"
                                text={`${extraction.uncertain.length} note${extraction.uncertain.length === 1 ? "" : "s"}`}
                                icon={showUncertain ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                iconPosition="end"
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
                        disabled={vm.themeBusy}
                        onClick={() => setConfirmRetry(true)}
                    />
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
