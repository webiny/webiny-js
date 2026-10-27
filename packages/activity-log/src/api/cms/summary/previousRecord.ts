/**
 * What to do with the newest record for this target, revision and actor.
 *
 * The dispatcher reads that record on every save that would otherwise dispatch, to decide whether
 * this save joins a run already in flight. Having read it, it can also see when that record's
 * values have been sitting there far too long — which is the sweeper's whole job, on a record
 * already in hand, for one write and no extra read.
 */
export type PreviousDisposition =
    /** Still inside the debounce window and still waiting: this save joins its run. */
    | "run"
    /** Past the sweep threshold with values still on it. Its job is never coming. */
    | "reclaim"
    /** Nothing to do with it. */
    | "ignore";

export interface PreviousDispositionParams {
    /** Whether the record still carries transient values waiting for a job. */
    pending: boolean;
    valuesWrittenOn: string | undefined;
    now: number;
    debounceWindowMs: number;
    sweepThresholdMs: number;
}

/**
 * Three outcomes, and the gap between the first two is deliberate.
 *
 * Inside the debounce window the job has not been dispatched long enough to have run, so the save
 * joins the run. Past the sweep threshold the job has had four times its worst realistic life and
 * has not settled, so the values are abandoned and get cleared.
 *
 * Between the two — older than a minute, younger than an hour — is a job that is plausibly still
 * running, and nothing happens to it. Clearing there would race a live job for its own values and
 * cost a summary that was about to be written. This is the one case worth being timid in: the
 * scheduled sweep covers it an hour later at no risk, and an abandoned record is not urgent.
 */
export const dispositionOfPrevious = (params: PreviousDispositionParams): PreviousDisposition => {
    if (!params.pending || !params.valuesWrittenOn) {
        return "ignore";
    }

    const age = params.now - new Date(params.valuesWrittenOn).getTime();

    if (!Number.isFinite(age)) {
        // An unparseable timestamp. Not reclaimed, because a record whose age cannot be read is
        // exactly the one where guessing wrong destroys values a running job still needs. The
        // scheduled sweep uses a storage-side comparison and is not fooled by this.
        return "ignore";
    }

    if (age <= params.debounceWindowMs) {
        return "run";
    }

    return age >= params.sweepThresholdMs ? "reclaim" : "ignore";
};
