/**
 * Human review of generated components: the verdicts Realpage's measure is computed from.
 *
 * Two levels, matching Realpage's own split of a migrated site — about 95% migrated by the technology,
 * the rest needing client approvals or human polish. "Client approvals" is a sign-off step, not a
 * quality judgement, so it has no level here. The labels are ours until Realpage gives us theirs; the
 * stored values are stable keys, so a relabel changes nothing already recorded.
 *
 * A verdict is about one specific output: it records the content hash of the component it was given
 * on, and a later revision of that component does not inherit it. It is not a decision — it does not
 * change what Promote moves — and it does not carry forward to the job's next run.
 */
export const REVIEW_VERDICTS = ["migrated", "needs-polish"] as const;
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

export const REVIEW_VERDICT_LABELS: Record<ReviewVerdict, string> = {
    migrated: "Migrated without manual edits",
    "needs-polish": "Needs human polish"
};

/** Why a component needs polish: the failure modes the baseline found. Closed, so verdicts aggregate. */
export const REVIEW_REASONS = [
    "wrong-height",
    "missing-image",
    "wrong-image",
    "background-or-pattern-wrong",
    "typography-wrong",
    "text-missing",
    "arrangement-wrong"
] as const;
export type ReviewReason = (typeof REVIEW_REASONS)[number];

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
    "wrong-height": "Wrong height",
    "missing-image": "Missing image",
    "wrong-image": "Wrong image",
    "background-or-pattern-wrong": "Background or pattern wrong",
    "typography-wrong": "Typography wrong",
    "text-missing": "Text missing",
    "arrangement-wrong": "Arrangement wrong"
};

/** The correction-log kind a review is recorded under. */
export const REVIEW_KIND = "review.verdict" as const;

const MAX_NOTE_LENGTH = 2000;

export interface ReviewInput {
    verdict: string;
    reasons?: string[] | null;
    note?: string | null;
}

/** What a review records as its human value. */
export interface ReviewValue {
    verdict: ReviewVerdict;
    reasons: ReviewReason[];
    note: string | null;
}

/** What a review records as its machine value: the exact output it was given on. */
export interface ReviewedOutput {
    contentSha256: string;
    revision: number;
}

/** Validates a review as given; an error message for anything outside the closed lists. */
export const parseReview = (input: ReviewInput): ReviewValue | string => {
    if (!REVIEW_VERDICTS.includes(input.verdict as ReviewVerdict)) {
        return `Unknown verdict "${input.verdict}". Use one of: ${REVIEW_VERDICTS.join(", ")}.`;
    }
    const reasons = [...new Set(input.reasons ?? [])];
    const unknown = reasons.filter(reason => !REVIEW_REASONS.includes(reason as ReviewReason));
    if (unknown.length > 0) {
        return `Unknown reason(s): ${unknown.join(", ")}. Use any of: ${REVIEW_REASONS.join(", ")}.`;
    }
    const note = (input.note ?? "").trim();
    if (note.length > MAX_NOTE_LENGTH) {
        return `The note is longer than ${MAX_NOTE_LENGTH} characters.`;
    }
    return {
        verdict: input.verdict as ReviewVerdict,
        // Kept in the closed list's order, so the same choice always records the same value.
        reasons: REVIEW_REASONS.filter(reason => reasons.includes(reason)),
        note: note || null
    };
};

export interface ReviewLogEntry {
    signature: string;
    createdOn: string;
    createdBy: { id: string; displayName: string | null } | null;
    machineValue: unknown;
    humanValue: unknown;
}

export interface ComponentReview extends ReviewValue {
    signature: string;
    reviewedOn: string;
    reviewer: { id: string; displayName: string | null } | null;
    contentSha256: string;
    revision: number;
    /**
     * Whether the review was given on the component's current output. False once the component has
     * been regenerated or refined since: the review stays on record, but it judged a different output.
     */
    current: boolean;
}

/**
 * The review that stands for each component: its latest, from the append-only log. A component's
 * current content hash decides whether that review was given on what the component is now.
 */
export const latestReviews = (
    entries: ReviewLogEntry[],
    currentHash: (signature: string) => string | undefined
): Record<string, ComponentReview> => {
    const latest: Record<string, ComponentReview> = {};
    const sorted = [...entries].sort((a, b) => a.createdOn.localeCompare(b.createdOn));
    for (const entry of sorted) {
        const human = entry.humanValue as Partial<ReviewValue> | null;
        const machine = entry.machineValue as Partial<ReviewedOutput> | null;
        if (!human?.verdict || !machine?.contentSha256) {
            continue;
        }
        latest[entry.signature] = {
            signature: entry.signature,
            verdict: human.verdict,
            reasons: human.reasons ?? [],
            note: human.note ?? null,
            reviewedOn: entry.createdOn,
            reviewer: entry.createdBy,
            contentSha256: machine.contentSha256,
            revision: machine.revision ?? 1,
            current: currentHash(entry.signature) === machine.contentSha256
        };
    }
    return latest;
};
