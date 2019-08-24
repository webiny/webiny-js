import User from "./entities/user";

describe("class ID test", () => {
    test("should be able to access classId on a class", async () => {
        expect(User.classId).toEqual("User");
    });

    test("should be able to access classId on an instance", async () => {
        const user = new User();
        expect(user.classId).toEqual("User");
    });
});
