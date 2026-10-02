/**
 * The shared half, and only the shared half.
 *
 * The two runtimes are reached through their own subpaths — `@webiny/activity-log/api` and
 * `@webiny/activity-log/admin` — rather than from here. A root barrel re-exporting both would let
 * an API Lambda pull the admin timeline, and with it React, into its bundle by importing the
 * package name alone. What is left is what genuinely belongs to both: how a field path becomes a
 * name a person can read, which the prompt, the stored sentence and the expanded row must all
 * agree on.
 */
export * from "./shared/index.js";
