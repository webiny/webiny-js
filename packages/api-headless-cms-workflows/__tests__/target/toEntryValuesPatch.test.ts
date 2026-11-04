import { describe, expect, it } from "vitest";
import { toEntryValuesPatch } from "~/features/target/toEntryValuesPatch.js";

const current = () => ({
    name: "Ann",
    age: 30,
    address: { street: "Main", zip: 1000, location: { label: "Home", floor: 2 } },
    tags: ["a"]
});

describe("toEntryValuesPatch", () => {
    it("patches a top-level key and leaves the others out", () => {
        expect(toEntryValuesPatch(current(), { name: "Bob" })).toEqual({ name: "Bob" });
    });

    it("keeps the siblings of a nested key", () => {
        expect(toEntryValuesPatch(current(), { "address.street": "Elm" })).toEqual({
            address: { street: "Elm", zip: 1000, location: { label: "Home", floor: 2 } }
        });
    });

    it("keeps the siblings of a deeply nested key at every level", () => {
        expect(toEntryValuesPatch(current(), { "address.location.label": "Work" })).toEqual({
            address: { street: "Main", zip: 1000, location: { label: "Work", floor: 2 } }
        });
    });

    it("merges several paths of the same object into one object", () => {
        const patch = toEntryValuesPatch(current(), {
            "address.street": "Elm",
            "address.location.label": "Work",
            "address.zip": 2000,
            age: 31
        });

        expect(patch).toEqual({
            address: { street: "Elm", zip: 2000, location: { label: "Work", floor: 2 } },
            age: 31
        });
    });

    it("creates an object that is null or missing", () => {
        expect(toEntryValuesPatch({ address: null }, { "address.street": "Elm" })).toEqual({
            address: { street: "Elm" }
        });
        expect(toEntryValuesPatch({}, { "address.location.label": "Work" })).toEqual({
            address: { location: { label: "Work" } }
        });
    });

    it("writes null as a value", () => {
        expect(toEntryValuesPatch(current(), { "address.zip": null })).toMatchObject({
            address: { zip: null, street: "Main" }
        });
    });

    it("never mutates the current values and copies every object it changes", () => {
        const values = current();
        const snapshot = JSON.parse(JSON.stringify(values));

        const patch = toEntryValuesPatch(values, { "address.location.label": "Work" });

        expect(values).toEqual(snapshot);
        expect((patch.address as object) === values.address).toBe(false);
        expect(
            ((patch.address as Record<string, unknown>).location as object) ===
                values.address.location
        ).toBe(false);
    });

    it("does not touch the prototype", () => {
        const patch = toEntryValuesPatch({}, { name: "Ann" });

        expect(Object.getPrototypeOf(patch)).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});
