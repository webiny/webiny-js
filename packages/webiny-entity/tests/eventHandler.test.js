import _ from "lodash";

import { EventHandler, Entity } from "./../src";

class EventsEntity extends Entity {}

describe("event handler test", () => {
    const a = new EventsEntity();

    EventsEntity.on("onAfterUpdate", _.noop);
    EventsEntity.on("onAfterUpdate", _.noop);
    EventsEntity.on("onAfterUpdate", _.noop).setOnce();
    a.on("onAfterCreate", _.noop).setOnce();
    a.on("onAfterCreate", _.noop);

    test("should have one event handler registered", async () => {
        expect(Object.keys(a.listeners)).toContainAllValues(["delete", "onAfterCreate"]);
        expect(a.listeners.onAfterCreate.length).toBe(2);
        expect(a.listeners.onAfterCreate[0]).toBeInstanceOf(EventHandler);
        expect(a.listeners.onAfterCreate[1]).toBeInstanceOf(EventHandler);

        expect(Object.keys(EventsEntity.listeners)).toContainAllValues(["onAfterUpdate"]);
        expect(EventsEntity.listeners.onAfterUpdate.length).toBe(3);
        expect(EventsEntity.listeners.onAfterUpdate[0]).toBeInstanceOf(EventHandler);
        expect(EventsEntity.listeners.onAfterUpdate[1]).toBeInstanceOf(EventHandler);
        expect(EventsEntity.listeners.onAfterUpdate[2]).toBeInstanceOf(EventHandler);
    });

    test("should return callback by calling getCallback", async () => {
        expect(typeof a.listeners.onAfterCreate[0].getCallback()).toBe("function");
        expect(typeof a.listeners.onAfterCreate[1].getCallback()).toBe("function");
    });

    test("setOnce should return true because it was set", async () => {
        expect(a.listeners.onAfterCreate[0].getOnce()).toBe(true);
        expect(a.listeners.onAfterCreate[1].getOnce()).toBe(false);

        EventsEntity.on("onAfterUpdate", _.noop).setOnce();
        expect(EventsEntity.listeners.onAfterUpdate.length).toBe(4);

        expect(EventsEntity.listeners.onAfterUpdate[0].getOnce()).toBe(false);
        expect(EventsEntity.listeners.onAfterUpdate[1].getOnce()).toBe(false);
        expect(EventsEntity.listeners.onAfterUpdate[2].getOnce()).toBe(true);
        expect(EventsEntity.listeners.onAfterUpdate[3].getOnce()).toBe(true);
    });
});
