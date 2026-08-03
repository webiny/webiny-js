import React, { useState } from "react";
import { Alert, Button, Text } from "@webiny/admin-ui";

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
    const [showAll, setShowAll] = useState(false);

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

    const visible = showAll ? uncertain : uncertain.slice(0, 3);

    // Low confidence deserves a stronger visual than a routine notice; high confidence should not shout.
    const type = confidence === "low" ? "warning" : "info";

    return (
        <Alert
            variant="subtle"
            type={type}
            title={entryUrl ? `Generated from ${entryUrl}` : "Generated from a website"}
        >
            <div className="flex flex-col gap-sm">
                {summary && (
                    <Text size="md" className="block text-neutral-strong">
                        {summary}
                    </Text>
                )}

                <Text size="sm" className="block text-neutral-dimmed">
                    {confidence
                        ? `The model reported ${confidence} confidence. Review before publishing.`
                        : "Review before publishing."}
                </Text>

                {uncertain.length > 0 && (
                    <div className="flex flex-col gap-xs">
                        <Text size="sm" className="block font-semibold">
                            Worth checking ({uncertain.length})
                        </Text>
                        {visible.map(entry => (
                            <Text key={entry.path} size="sm" className="block text-neutral-strong">
                                <span className="font-mono">{entry.path}</span> — {entry.reason}
                            </Text>
                        ))}
                        {uncertain.length > visible.length && (
                            <div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAll(true)}
                                    text={`Show ${uncertain.length - visible.length} more`}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/*
                  What we threw away, kept visible rather than buried in the task log. If a slot looks
                  wrong, the most likely explanation is that the model named something we rejected — and
                  a user who can see that will ask a much better question than "the theme is wrong".
                */}
                {discarded.length > 0 && (
                    <Text size="sm" className="block text-neutral-dimmed">
                        {discarded.length} value{discarded.length === 1 ? "" : "s"} the model
                        suggested could not be used and fell back to defaults.
                    </Text>
                )}

                <div>
                    <Button variant="ghost" onClick={() => setDismissed(true)} text="Dismiss" />
                </div>
            </div>
        </Alert>
    );
};
