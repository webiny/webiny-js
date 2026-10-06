import React, { useState } from "react";
import { Button, Checkbox, Tag, Text, Textarea } from "@webiny/admin-ui";
import type { ComponentReviewDto, ReviewOptionDto } from "~/shared/types.js";

interface Props {
    contentSha256: string;
    review: ComponentReviewDto | undefined;
    verdicts: ReviewOptionDto[];
    reasons: ReviewOptionDto[];
    saving: boolean;
    onSave: (review: { verdict: string; reasons: string[]; note: string }) => void;
}

const labelOf = (options: ReviewOptionDto[], value: string) =>
    options.find(option => option.value === value)?.label ?? value;

const reviewedLine = (review: ComponentReviewDto, current: boolean) => {
    const who = review.reviewer?.displayName ?? "someone";
    const when = new Date(review.reviewedOn).toLocaleString();
    return current
        ? `Reviewed by ${who}, ${when}.`
        : `Reviewed by ${who}, ${when}, on an earlier output (revision ${review.revision}). This output has not been reviewed.`;
};

/**
 * The human review of one generated component: a required verdict, optional reasons from a closed
 * list, an optional note. Separate from Accept/Reject on purpose — a verdict is logged only, and never
 * changes what Promote moves. It judges the output on screen: a review given on an earlier revision is
 * shown as such and does not prefill, because it judged something else.
 */
export const ReviewControl = ({
    contentSha256,
    review,
    verdicts,
    reasons,
    saving,
    onSave
}: Props) => {
    const current = review ? review.contentSha256 === contentSha256 : false;
    const standing = current ? review : undefined;
    const [verdict, setVerdict] = useState(standing?.verdict ?? "");
    const [chosen, setChosen] = useState<string[]>(standing?.reasons ?? []);
    const [note, setNote] = useState(standing?.note ?? "");

    if (verdicts.length === 0) {
        return null;
    }

    const toggleReason = (value: string, checked: boolean) =>
        setChosen(list => (checked ? [...list, value] : list.filter(item => item !== value)));

    const unchanged =
        standing !== undefined &&
        standing.verdict === verdict &&
        standing.reasons.join() ===
            reasons
                .filter(r => chosen.includes(r.value))
                .map(r => r.value)
                .join() &&
        (standing.note ?? "") === note.trim();

    return (
        <div className="flex flex-col gap-sm border-t border-neutral-dimmed px-md py-sm">
            <div className="flex items-center gap-sm">
                <Text size="sm" className="font-semibold">
                    Review
                </Text>
                {standing ? (
                    <Tag variant="neutral-base" content={labelOf(verdicts, standing.verdict)} />
                ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-sm">
                {verdicts.map(option => (
                    <Button
                        key={option.value}
                        variant={verdict === option.value ? "primary" : "secondary"}
                        size="sm"
                        text={option.label}
                        onClick={() => setVerdict(option.value)}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-md gap-y-xs">
                {reasons.map(option => (
                    <Checkbox
                        key={option.value}
                        label={option.label}
                        checked={chosen.includes(option.value)}
                        onChange={checked => toggleReason(option.value, checked)}
                    />
                ))}
            </div>
            <Textarea
                value={note}
                onChange={(value: string) => setNote(value)}
                placeholder="Note (optional)"
                rows={2}
            />
            <div className="flex items-center gap-sm">
                <Button
                    variant="primary"
                    size="sm"
                    text={saving ? "Saving…" : "Save review"}
                    disabled={!verdict || saving || unchanged}
                    onClick={() => onSave({ verdict, reasons: chosen, note })}
                />
                {review ? (
                    <Text size="sm" className="text-neutral-strong">
                        {reviewedLine(review, current)}
                    </Text>
                ) : null}
            </div>
        </div>
    );
};
