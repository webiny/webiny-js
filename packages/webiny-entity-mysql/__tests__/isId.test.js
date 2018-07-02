import SimpleEntity from "./entities/simpleEntity";

describe("driver override test", () => {
    test("should validate given ID correctly (static call)", async () => {
        expect(SimpleEntity.isId(123)).toBe(false);
        expect(SimpleEntity.isId("01234567890123456789adee")).toBe(true);
    });

    test("should validate given ID correctly (instance call)", async () => {
        const user1 = new SimpleEntity();
        expect(user1.isId(123)).toBe(false);
        expect(user1.isId("01234567890123456789adee")).toBe(true);
    });
});
