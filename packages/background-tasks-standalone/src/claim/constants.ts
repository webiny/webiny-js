/*
 * How long a claim lasts unless its owner extends it. A process that dies stops extending, so its
 * tasks can be taken over this long after its last extension. Shorter recovers sooner, but a process
 * that is alive and only slow (a busy event loop, a slow database) could lose a task it is running.
 */
export const CLAIM_TTL_MS = 60_000;

// A third of the TTL, so one or two missed extensions do not lose the claim.
export const CLAIM_RENEW_EVERY_MS = 20_000;

// How often each process looks for tasks that nobody holds.
export const RECOVER_EVERY_MS = 60_000;

/*
 * A pending task saved this recently is left alone by recovery. It covers the moment between a
 * trigger creating a task and claiming it, when nobody holds it yet, and a claim the trigger could
 * not write, which the first iteration then takes.
 */
export const RECOVER_GRACE_MS = CLAIM_TTL_MS;

/*
 * Takeovers of one task, with no save in between, before recovery fails it instead. A task that
 * crashes the process it runs in would otherwise be resumed on every start and take the server down
 * each time.
 */
export const MAX_RECOVERIES = 3;
