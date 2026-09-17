/**
 * The numbers that decide how hard an emailed reset code is to abuse. Kept together, and out of
 * both use cases, because they only make sense read as a set: the code is six digits, so its safety
 * comes from the attempt cap, not from the space, and the request cap is what stops somebody
 * collecting fresh codes to spend those attempts on.
 */

/**
 * How long a code stays usable. Long enough to survive a slow mail queue and a user who goes to
 * find their phone, short enough that a message sitting in an open mailbox stops being a key.
 */
export const RESET_CODE_TTL_MINUTES = 15;

/**
 * Failed verifications a single code tolerates before it is dead.
 *
 * This is the number that matters. Six digits is a million possibilities, which is nothing to a
 * script, so the code is not protected by being hard to guess. It is protected by only being
 * guessable five times.
 */
export const RESET_CODE_MAX_ATTEMPTS = 5;

/** Codes that may be requested for one address per window. Enough for "resend" twice. */
export const RESET_REQUESTS_PER_WINDOW = 3;

export const RESET_REQUEST_WINDOW_MINUTES = 15;

/**
 * The shortest a reset request may take to answer.
 *
 * Everything up to the last step costs the same for an address with an account and one without: the
 * same count, the same hash, the same row write, the same credential lookup. Only the last step
 * differs, because a real account gets an email sent, and waiting on an SMTP server is time an
 * attacker can measure. Holding every answer to the same floor hides that difference.
 *
 * Chosen to sit above a typical send. It is not a guarantee: a mail server slower than this still
 * pushes the real path past the floor, which is why the honest fix is to take the send off the
 * request entirely. This closes the everyday gap without waiting for that.
 */
export const RESET_REQUEST_MIN_DURATION_MS = 1_000;

/**
 * How long spent and expired rows are kept before a later write clears them out. Not zero, so that
 * a support question about a reset that happened an hour ago still has something to look at.
 */
export const RESET_CODE_RETENTION_HOURS = 24;
