import { validation } from "../src";

describe("empty validators test", () => {
    it("should pass - no validators sent", async () => {
        expect(validation.validate("", "")).resolves.toBe(true);
        expect(validation.validateSync("", "")).toBe(true);
    });

    it("should fail - invalid parameter sent", () => {
        expect(validation.validate("", {})).rejects.toThrow(Error);

        try {
            validation.validateSync("", {});
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown`);
    });
});
