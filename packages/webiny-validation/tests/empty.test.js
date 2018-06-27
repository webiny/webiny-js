import { validation } from "./../src";
import "./chai";

describe("empty validators test", () => {
    it("should pass - no validators sent", async () => {
        validation.validate("", "").should.be.fulfilled;
        validation.validateSync("", "").should.be.true;
    });

    it("should fail - invalid parameter sent", () => {
        validation.validate("", {}).should.be.rejected;

        try {
            validation.validateSync("", {});
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown`);
    });
});
