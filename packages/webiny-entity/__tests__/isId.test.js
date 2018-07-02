import User from "./entities/user";

describe("driver override test", () => {
    test("should validate given ID correctly (static call)", async () => {
        expect(User.isId(123)).toBe(false);
        expect(User.isId("asd")).toBe(true);
    });

    test("should validate given ID correctly (static call)", async () => {
        const user = new User();
        expect(user.isId(123)).toBe(false);
        expect(user.isId("asd")).toBe(true);
    });
});
