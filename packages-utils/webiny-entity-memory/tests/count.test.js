import { assert } from "chai";
import SimpleEntity from "./entities/simpleEntity";

describe("count test", function() {
    it("count - should count entities correctly", async () => {
        SimpleEntity.getDriver().flush();
        assert.equal(await SimpleEntity.count(), 0);

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        assert.equal(await SimpleEntity.count(), 1);
    });
});
