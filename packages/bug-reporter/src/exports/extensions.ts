/*
 * `<BugReporter />` is composed into every project by DefaultExtensions, so a project never writes
 * it. This export is for `<BugReporter.GitHub>`: the token and repository a project supplies to
 * have the API file issues itself instead of handing the reporter a prefilled URL.
 */
export { BugReporter } from "~/BugReporter.js";
