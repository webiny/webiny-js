import { describe, it, expect } from "vitest";
import { readTargetRepository } from "~/admin/capture/readTargetRepository.js";
import { DEFAULT_REPOSITORY } from "~/shared/repository.js";

describe("readTargetRepository", () => {
    it("uses the configured repository", () => {
        expect(readTargetRepository("acme/app")).toBe("acme/app");
    });

    /*
     * `BuildParams.get` returns null for a param nobody emitted, which is every project that has
     * not configured the bug reporter. The dialog still has to name somewhere.
     */
    it.each([[null], [undefined], [""], ["   "], [42], [{}]])(
        "falls back to the default for %j",
        value => {
            expect(readTargetRepository(value)).toBe(DEFAULT_REPOSITORY);
        }
    );

    /* The same constant the API composes against, so the dialog cannot name a different one. */
    it("agrees with the API about where an unconfigured report goes", () => {
        expect(DEFAULT_REPOSITORY).toBe("webiny/webiny-js");
    });
});
