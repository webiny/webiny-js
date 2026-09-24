import { DEFAULT_REPOSITORY } from "../../shared/repository.js";

/*
 * Where the dialog tells the reporter their report is going.
 *
 * The admin app only learns this because `Project.BugReporter` emits the repository as an admin
 * build param alongside the API one. The token is never emitted that way and must not be: it would
 * end up in the browser bundle. So the dialog can name the destination but cannot tell whether the
 * API will file the issue or hand back a composer, which is why the wording it feeds has to be true
 * of both.
 */
export function readTargetRepository(value: unknown): string {
    if (typeof value !== "string") {
        return DEFAULT_REPOSITORY;
    }

    const configured = value.trim();
    if (configured === "") {
        return DEFAULT_REPOSITORY;
    }

    return configured;
}
