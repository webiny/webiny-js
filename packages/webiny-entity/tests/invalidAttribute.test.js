import User from "./entities/user";

describe("invalid attribute test", () => {
    test("should throw an error - attribute doesn't exist", async () => {
        const user = new User();
        user.something = 123;
        expect(user.something).toEqual(123);
    });
});
