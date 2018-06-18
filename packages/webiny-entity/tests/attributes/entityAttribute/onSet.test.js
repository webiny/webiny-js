import { One, Two } from "../../entities/oneTwoThree";

describe("onSet test", () => {
    beforeEach(() => One.getEntityPool().flush());

    test("should return value set inside onSet callback", async () => {
        const one = new One();
        const forcedTwo = new Two();
        forcedTwo.id = "forced";

        one.getAttribute("two").onSet(() => forcedTwo);

        one.two = new Two();

        expect(await one.get("two.id")).toEqual("forced");
    });
});
