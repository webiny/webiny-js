import User from "./entities/user";

describe("class name test", () => {
    test("should be able to access class name on a class", async () => {
        expect(User.getClassName()).toEqual("User");
    });

    test("should be able to access class name on an instance", async () => {
        const user = new User();
        expect(user.getClassName()).toEqual("User");
    });
});
