import { describe, expect, it } from "vitest";
import { createSystemName } from "~/utils/createSystemName.js";

describe("createSystemName", () => {
    it("should properly create a system name out of env", () => {
        const result = createSystemName({
            env: "testing",
            variant: undefined
        });

        expect(result).toEqual("testing");
    });

    it("should properly create a system name out of env and variant", () => {
        const result = createSystemName({
            env: "testing",
            variant: "blue"
        });

        expect(result).toEqual("testing#blue");
    });
});
