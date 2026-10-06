import { describe, expect, it } from "vitest";
import { noOutputReason } from "./noOutputReason.js";

describe("noOutputReason", () => {
    it("says a component was not generated, and why, when no model call was made", () => {
        expect(
            noOutputReason({ notGenerated: "no member of the cluster has a usable reference crop" })
        ).toBe("not generated: no member of the cluster has a usable reference crop");
    });

    it("says every attempt failed when attempts were made and none produced output", () => {
        expect(noOutputReason({})).toBe("every generation attempt failed");
    });

    it("says no result was recorded when the component task never wrote one", () => {
        expect(noOutputReason(null)).toBe("no result recorded: the component task did not finish");
    });
});
