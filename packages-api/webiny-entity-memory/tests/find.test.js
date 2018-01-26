import { assert } from "chai";
import SimpleEntity from "./entities/simpleEntity";

describe("find test", function() {
    it("find - should find entities", async () => {
        SimpleEntity.getDriver()
            .flush()
            .import("SimpleEntity", [
                { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
                { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
                { id: 3, name: "SameEntity", slug: "sameEntity", enabled: false },
                { id: 4, name: "SameEntity", slug: "sameEntity", enabled: true }
            ]);

        let entities = await SimpleEntity.find();

        assert.isArray(entities);
        assert.lengthOf(entities, 4);

        assert.equal(entities[0].id, 1);
        assert.equal(entities[0].name, "This is a test");
        assert.equal(entities[0].slug, "thisIsATest");
        assert.isTrue(entities[0].enabled);

        assert.equal(entities[1].id, 2);
        assert.equal(entities[1].name, "This is a test 222");
        assert.equal(entities[1].slug, "thisIsATest222");
        assert.isFalse(entities[1].enabled);

        entities = await SimpleEntity.find({ query: { name: "SameEntity" } });

        assert.isArray(entities);
        assert.lengthOf(entities, 2);

        assert.equal(entities[0].id, 3);
        assert.equal(entities[0].name, "SameEntity");
        assert.equal(entities[0].slug, "sameEntity");
        assert.isFalse(entities[0].enabled);

        assert.equal(entities[1].id, 4);
        assert.equal(entities[1].name, "SameEntity");
        assert.equal(entities[1].slug, "sameEntity");
        assert.isTrue(entities[1].enabled);

        entities = await SimpleEntity.find({ query: { name: "SameEntity", enabled: true } });

        assert.isArray(entities);
        assert.lengthOf(entities, 1);

        assert.equal(entities[0].id, 4);
        assert.equal(entities[0].name, "SameEntity");
        assert.equal(entities[0].slug, "sameEntity");
        assert.isTrue(entities[0].enabled);
    });
});
