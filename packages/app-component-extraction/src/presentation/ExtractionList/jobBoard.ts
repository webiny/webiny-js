import { STAGES, type Stage } from "~/constants.js";
import { currentStage, stageEntry } from "~/shared/ledger.js";
import type { IdentityDto, JobListItemDto, RunDto } from "~/shared/types.js";
import { pausedGateStage, runOverallStatus } from "~/presentation/shared/runStatus.js";

/**
 * The extractions board and table, as data: which column a job sits in, who owns it, what its card
 * says and when. Everything here is derived from the job and its latest run as the list query returns
 * them; nothing is fetched per card.
 */
export type BoardColumn = "needs-review" | "running" | "failed" | "not-started" | "complete";

export const BOARD_COLUMNS: Array<{ key: BoardColumn; label: string }> = [
    { key: "needs-review", label: "Needs review" },
    { key: "running", label: "Running" },
    { key: "failed", label: "Failed" },
    { key: "not-started", label: "Not started" },
    { key: "complete", label: "Complete" }
];

/**
 * The shared admin login of this instance, created at install: every job before per-person users
 * existed was created with it (or with an API key). Its jobs read "Shared login", never as anyone's.
 */
export const SHARED_LOGIN_IDS: readonly string[] = ["6ab0ec3d2ced950002a5e3c2"];

/**
 * The column a job sits in. A run waits for its next stage to be run by hand, so "needs review" is a
 * run with nothing running or failed and a stage ready to run, or one marked stale. A cancelled run
 * sits with the failed, carrying its fixed reason.
 */
export const boardColumn = (run: RunDto | null): BoardColumn => {
    const status = runOverallStatus(run);
    switch (status) {
        case "running":
            return "running";
        case "failed":
        case "cancelled":
            return "failed";
        case "paused":
        case "stale":
            return "needs-review";
        case "complete":
            return "complete";
        default:
            return "not-started";
    }
};

export interface Owner {
    /** Who it is for search and the label: a person's name, or "Shared login". */
    label: string;
    /** The account as recorded, for a tooltip. */
    account: string;
    shared: boolean;
    /** Two letters for the avatar. */
    initials: string;
}

const initialsOf = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0]!.toUpperCase())
        .join("") || "?";

/**
 * The owner as a label: whoever the job is assigned to, else who created it, as the CMS stamped it. The shared login and API keys are accounts,
 * not people, so their jobs say so; a job with no record says that instead of guessing.
 */
export const ownerOf = (
    createdBy: IdentityDto | null | undefined,
    sharedIds: readonly string[] = SHARED_LOGIN_IDS
): Owner => {
    if (!createdBy) {
        return {
            label: "Not recorded",
            account: "No creator recorded",
            shared: true,
            initials: "?"
        };
    }
    const name = createdBy.displayName || createdBy.id;
    if (createdBy.type !== "admin" || sharedIds.includes(createdBy.id)) {
        const kind = createdBy.type === "admin" ? "Shared admin login" : "API key";
        return { label: "Shared login", account: `${kind}: ${name}`, shared: true, initials: "SL" };
    }
    return { label: name, account: name, shared: false, initials: initialsOf(name) };
};

/** The job's owner: whoever it is assigned to, or who created it when nobody has assigned it. */
export const jobOwner = (job: JobListItemDto["job"]): IdentityDto | null =>
    job.owner ?? job.createdBy ?? null;

export const isMine = (item: JobListItemDto, identityId: string | null): boolean =>
    Boolean(identityId) && jobOwner(item.job)?.id === identityId;

const latest = (values: Array<string | null | undefined>): string | null =>
    values
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

/** The stage before `stage` in the pipeline, or null for the first. */
const previousStage = (stage: Stage): Stage | null => {
    const index = STAGES.indexOf(stage);
    return index > 0 ? STAGES[index - 1]! : null;
};

export interface Timing {
    /** "Waiting", "Started", "Failed", "Created", "Finished". */
    verb: string;
    /** ISO time the verb is counted from; null when the run does not record it. */
    at: string | null;
}

/** The one time a card shows, per column. Every one is a stored time; none is estimated. */
export const timingOf = (item: JobListItemDto): Timing => {
    const run = item.latestRun;
    const column = boardColumn(run);
    if (!run || column === "not-started") {
        return { verb: "Created", at: item.job.createdOn };
    }
    if (column === "running") {
        const running = run.stages.find(
            entry => entry.status === "running" || entry.status === "starting"
        );
        return { verb: "Started", at: running?.startedOn ?? null };
    }
    if (column === "failed") {
        const failed = run.stages.find(entry => entry.status === "failed");
        return {
            verb: run.status === "cancelled" ? "Cancelled" : "Failed",
            at: failed?.finishedOn ?? latest(run.stages.map(entry => entry.finishedOn))
        };
    }
    if (column === "complete") {
        return { verb: "Finished", at: stageEntry(run, "promote")?.finishedOn ?? null };
    }
    // Needs review: waiting since the stage before the next one finished, or since the run was made.
    const next = pausedGateStage(run);
    const before = next ? previousStage(next) : null;
    return {
        verb: "Waiting",
        at: before
            ? (stageEntry(run, before)?.finishedOn ?? null)
            : next
              ? run.createdOn
              : latest(run.stages.map(entry => entry.finishedOn))
    };
};

/** Why a failed card failed: the failed stage's own message, or the fixed one a cancel writes. */
export const failureOf = (run: RunDto | null): string | null => {
    if (!run || boardColumn(run) !== "failed") {
        return null;
    }
    const failed = run.stages.find(entry => entry.status === "failed");
    return (
        failed?.error ??
        (run.status === "cancelled" ? "Cancelled before it finished." : "No reason recorded.")
    );
};

/** The stage a card names: the running or failed one, or the next one to run. */
export const cardStage = (run: RunDto | null): Stage | null => {
    if (!run) {
        return null;
    }
    const failed = run.stages.find(entry => entry.status === "failed");
    if (failed) {
        return failed.stage as Stage;
    }
    return currentStage(run);
};

export type SortOrder = "oldest" | "newest";

/** Each column's default order: what someone scanning it wants first. */
export const DEFAULT_ORDER: Record<BoardColumn, SortOrder> = {
    "needs-review": "oldest",
    running: "newest",
    failed: "oldest",
    "not-started": "newest",
    complete: "newest"
};

/** Search over job name, site URL and owner. */
export const matchesSearch = (item: JobListItemDto, query: string): boolean => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return true;
    }
    const owner = ownerOf(jobOwner(item.job));
    return `${item.job.name} ${item.job.siteUrl} ${owner.label} ${owner.account}`
        .toLowerCase()
        .includes(needle);
};

/** A column's jobs in its order; a job whose time is not recorded sorts last either way. */
export const sortColumn = (items: JobListItemDto[], order: SortOrder): JobListItemDto[] =>
    [...items].sort((a, b) => {
        const at = timingOf(a).at;
        const bt = timingOf(b).at;
        if (!at || !bt) {
            return at ? -1 : bt ? 1 : 0;
        }
        return order === "oldest" ? at.localeCompare(bt) : bt.localeCompare(at);
    });

/** "12 min", "6 h", "3 days": how long ago, in the largest whole unit. */
export const elapsed = (at: string, now: number = Date.now()): string => {
    const minutes = Math.max(0, Math.floor((now - new Date(at).getTime()) / 60000));
    if (minutes < 1) {
        return "under a minute";
    }
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} h`;
    }
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day" : `${days} days`;
};

/** The card's time in words: "Waiting 3 days", "Failed 5 h ago"; says so when it is not recorded. */
export const timingText = (timing: Timing, now: number = Date.now()): string =>
    !timing.at
        ? `${timing.verb}: time not recorded`
        : timing.verb === "Waiting"
          ? `Waiting ${elapsed(timing.at, now)}`
          : `${timing.verb} ${elapsed(timing.at, now)} ago`;
