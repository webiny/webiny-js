import { assert } from "chai";
import SimpleEntity from "./entities/simpleEntity";

describe("findById test", function() {
    it("findById - should find previously inserted entity", async () => {
        SimpleEntity.getDriver()
            .flush("SimpleEntity")
            .import("SimpleEntity", [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                }
            ]);

        const simpleEntity = await SimpleEntity.findById(1);

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "This is a test");
        assert.equal(simpleEntity.slug, "thisIsATest");
        assert.isTrue(simpleEntity.enabled);
    });
});
