import User from "./entities/user";

describe("set test", () => {
    test("should populate values correctly", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe", age: 12, enabled: true });
        expect(user.firstName).toEqual("John");
        expect(user.lastName).toEqual("Doe");
        expect(user.age).toEqual(12);
        expect(user.enabled).toEqual(true);
    });
});
