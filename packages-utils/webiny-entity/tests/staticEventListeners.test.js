import { assert } from "chai";
import _ from "lodash";

import { Entity } from "./../lib";

describe("ensure that static event listeners are properly registered among different classes", function() {
    it("should have listeners registered correctly", async () => {
        class ClassA extends Entity {}

        class ClassB extends Entity {}

        class ClassC extends Entity {}

        ClassA.on("eventX", _.noop);
        ClassB.on("eventY", _.noop);
        ClassC.on("eventZ", _.noop);

        assert.hasAllKeys(ClassA.listeners, ["eventX"]);
        assert.lengthOf(ClassA.listeners.eventX, 1);
        assert.hasAllKeys(ClassB.listeners, ["eventY"]);
        assert.lengthOf(ClassB.listeners.eventY, 1);
        assert.hasAllKeys(ClassC.listeners, ["eventZ"]);
        assert.lengthOf(ClassC.listeners.eventZ, 1);

        ClassA.on("eventX", _.noop);

        assert.hasAllKeys(ClassA.listeners, ["eventX"]);
        assert.lengthOf(ClassA.listeners.eventX, 2);
        assert.hasAllKeys(ClassB.listeners, ["eventY"]);
        assert.lengthOf(ClassB.listeners.eventY, 1);
        assert.hasAllKeys(ClassC.listeners, ["eventZ"]);
        assert.lengthOf(ClassC.listeners.eventZ, 1);

        class ClassD extends ClassA {}

        assert.hasAllKeys(ClassD.listeners, ["eventX"]);
        assert.lengthOf(ClassD.listeners.eventX, 2);
    });
});
