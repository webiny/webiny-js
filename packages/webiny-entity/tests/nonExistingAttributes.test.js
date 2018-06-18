import User from "./entities/user";

describe("set test", () => {
    test("should fail because attribute doesn't exist", async () => {
        const user = new User();
        user.nonExistingAttr = "John";
        expect(user.nonExistingAttr).toEqual("John");
    });
});
