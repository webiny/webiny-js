import User from "./entities/user";

describe("set test", () => {
    test("should set values correctly", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.age = 12;
        user.enabled = true;

        expect(user.firstName).toEqual("John");
        expect(user.lastName).toEqual("Doe");
        expect(user.age).toEqual(12);
        expect(user.enabled).toEqual(true);
    });
});
