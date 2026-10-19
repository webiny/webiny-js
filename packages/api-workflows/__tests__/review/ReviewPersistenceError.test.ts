import { describe, expect, it } from "vitest";
import { ReviewPersistenceError } from "~/domain/review/errors.js";

const RAW = "Table workflows-secret is not reachable.";

describe("ReviewPersistenceError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new ReviewPersistenceError(source);

        expect(error.code).toBe("Workflows/Review/Persistence");
        expect(error.message).toBe("The review could not be read or saved.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(JSON.stringify(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
    });
});
