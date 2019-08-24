import _ from "lodash";

import { Entity } from "@webiny/entity";

describe("ensure that static event listeners are properly registered among different classes", () => {
    test("should have listeners registered correctly", async () => {
        class ClassA extends Entity {}

        class ClassB extends Entity {}

        class ClassC extends Entity {}

        ClassA.on("eventX", _.noop);
        ClassB.on("eventY", _.noop);
        ClassC.on("eventZ", _.noop);

        expect(Object.keys(ClassA.listeners)).toEqual(["eventX"]);
        expect(ClassA.listeners.eventX.length).toBe(1);
        expect(Object.keys(ClassB.listeners)).toEqual(["eventY"]);
        expect(ClassB.listeners.eventY.length).toBe(1);
        expect(Object.keys(ClassC.listeners)).toEqual(["eventZ"]);
        expect(ClassC.listeners.eventZ.length).toBe(1);

        ClassA.on("eventX", _.noop);

        expect(Object.keys(ClassA.listeners)).toEqual(["eventX"]);
        expect(ClassA.listeners.eventX.length).toBe(2);
        expect(Object.keys(ClassB.listeners)).toEqual(["eventY"]);
        expect(ClassB.listeners.eventY.length).toBe(1);
        expect(Object.keys(ClassC.listeners)).toEqual(["eventZ"]);
        expect(ClassC.listeners.eventZ.length).toBe(1);

        class ClassD extends ClassA {}

        expect(Object.keys(ClassD.listeners)).toEqual(["eventX"]);
        expect(ClassD.listeners.eventX.length).toBe(2);
    });
});
