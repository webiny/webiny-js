import { assert } from "chai";
import { One, Two } from "../../entities/oneTwoThree";

describe("onSet test", function() {
    beforeEach(() => One.getEntityPool().flush());

    it("should return value set inside onSet callback", async () => {
        const one = new One();
        const forcedTwo = new Two();
        forcedTwo.id = "forced";

        one.getAttribute("two").onSet(() => forcedTwo);

        one.two = new Two();

        assert.equal(await one.get("two.id"), "forced");
    });
});
