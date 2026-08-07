import React, { useState } from "react";
import { Button, cn, Text } from "@webiny/admin-ui";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";

/**
 * The review banner on a generated theme — see the design brief, screen 5.
 *
 * A generated theme looks exactly like a hand-made one, which is the problem: without this the user has
 * no way to tell which values were measured, which were a model's judgement, and which it was unsure
 * about. This reads the `metadata` the extraction task wrote, so the banner is a view of stored facts
 * rather than a message passed through the UI — it survives a page reload and is still there tomorrow.
 */

export interface ExtractionMetadataView {
    source?: unknown;
    entryUrl?: unknown;
    sampledUrls?: unknown;
    confidence?: unknown;
    summary?: unknown;
    uncertain?: unknown;
    discarded?: unknown;
    appliedCount?: unknown;
}

interface Uncertainty {
    path: string;
    reason: string;
}

/**
 * Metadata is `Record<string, unknown>` on the wire, so every field is checked rather than asserted. A
 * theme whose metadata predates this feature, or was written by hand, must render nothing rather than
 * throw inside the editor.
 */
const asUncertainties = (value: unknown): Uncertainty[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (entry): entry is Uncertainty =>
            !!entry &&
            typeof entry === "object" &&
            typeof (entry as Uncertainty).path === "string" &&
            typeof (entry as Uncertainty).reason === "string"
    );
};

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

interface ExtractionReviewBannerProps {
    metadata: Record<string, unknown> | undefined;
}

export const ExtractionReviewBanner = ({ metadata }: ExtractionReviewBannerProps) => {
    const [dismissed, setDismissed] = useState(false);
    // Collapsed by default: this sits above the whole editor, so it stays a slim one-liner until the
    // user asks for the detail — the summary and the (potentially long) review list live behind it.
    const [expanded, setExpanded] = useState(false);

    const view = (metadata ?? {}) as ExtractionMetadataView;

    // Only generated themes get a banner.
    if (view.source !== "extraction" || dismissed) {
        return null;
    }

    const entryUrl = asString(view.entryUrl);
    const summary = asString(view.summary);
    const confidence = asString(view.confidence);
    const uncertain = asUncertainties(view.uncertain);
    const discarded = asUncertainties(view.discarded);

    // Low confidence takes a warning accent; otherwise the theme's own accent — the banner reads as
    // "generated, review me", not as an error.
    const attention = confidence === "low";
    const hasDetails = Boolean(summary) || uncertain.length > 0;

    const reviewLine =
        uncertain.length > 0
            ? `Review the values before publishing — ${uncertain.length} worth checking${
                  confidence ? `, ${confidence} confidence` : ""
              }.`
            : `Review the values before publishing${
                  confidence ? `, ${confidence} confidence` : ""
              }.`;

    return (
        <div
            className={cn(
                "mx-md mt-sm flex items-start gap-sm rounded-md border border-neutral-dimmed border-l-4 bg-neutral-light px-md py-sm",
                attention ? "border-l-warning-xstrong" : "border-l-primary"
            )}
        >
            <InfoIcon
                aria-hidden={true}
                className={cn(
                    "size-5 flex-none mt-[2px]",
                    attention ? "fill-warning-xstrong" : "fill-primary"
                )}
            />

            <div className="flex flex-1 min-w-0 flex-col gap-sm">
                <div className="flex items-start gap-sm">
                    <div className="flex flex-1 min-w-0 flex-col gap-xxs">
                        <Text size="sm" className="block font-semibold text-neutral-primary">
                            {entryUrl ? `AI-generated from ${entryUrl}` : "AI-generated theme"}
                        </Text>
                        <Text size="sm" className="block text-neutral-strong leading-snug">
                            {reviewLine}
                        </Text>
                    </div>
                    <div className="flex flex-none items-center gap-xs">
                        {hasDetails ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded(value => !value)}
                                text={expanded ? "Hide" : "Details"}
                            />
                        ) : null}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDismissed(true)}
                            text="Dismiss"
                        />
                    </div>
                </div>

                {expanded ? (
                    <div className="flex flex-col gap-sm">
                        {summary ? (
                            <Text size="sm" className="block text-neutral-strong leading-snug">
                                {summary}
                            </Text>
                        ) : null}

                        {uncertain.length > 0 ? (
                            <div className="flex flex-col gap-xs">
                                <Text
                                    size="sm"
                                    className="block uppercase tracking-wide font-semibold text-neutral-strong"
                                >
                                    {`Worth checking · ${uncertain.length}`}
                                </Text>
                                {/* Capped + scrollable, and each item is a titled block (path over
                                    reason) so a long list neither pushes the editor down nor runs
                                    together into a wall. */}
                                <div className="flex max-h-[220px] flex-col divide-y divide-neutral-dimmed overflow-y-auto rounded-md border border-neutral-dimmed bg-neutral-base">
                                    {uncertain.map(entry => (
                                        <div
                                            key={entry.path}
                                            className="flex flex-col gap-xxs px-sm py-xs"
                                        >
                                            <Text
                                                size="sm"
                                                className="block font-mono text-neutral-strong"
                                            >
                                                {entry.path}
                                            </Text>
                                            <Text
                                                size="sm"
                                                className="block text-neutral-dimmed leading-snug"
                                            >
                                                {entry.reason}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/*
                          What we threw away, kept visible rather than buried in the task log. If a slot
                          looks wrong, the likeliest reason is the model named something we rejected — and
                          a user who can see that asks a far better question than "the theme is wrong".
                        */}
                        {discarded.length > 0 ? (
                            <Text size="sm" className="block text-neutral-dimmed">
                                {`${discarded.length} value${
                                    discarded.length === 1 ? "" : "s"
                                } the model suggested could not be used and fell back to defaults.`}
                            </Text>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
