import { validation } from "../src";

describe("empty validators test", () => {
    it("should pass - no validators sent", async () => {
        await expect(validation.validate("", "")).resolves.toBe(true);
        await expect(validation.validateSync("", "")).toBe(true);
    });

    it("should fail - invalid parameter sent", async () => {
        await expect(validation.validate("", {})).rejects.toThrow(Error);

        try {
            validation.validateSync("", {});
        } catch {
            return;
        }

        throw Error(`Error should've been thrown`);
    });
});
