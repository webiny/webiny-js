import User from "./entities/user";

describe("attribute name test", () => {
    test("should return correct attribute name", async () => {
        const user = new User();
        expect(user.getAttribute("firstName").getName()).toEqual("firstName");
        expect(user.getAttribute("lastName").getName()).toEqual("lastName");
        expect(user.getAttribute("enabled").getName()).toEqual("enabled");
        expect(user.getAttribute("age").getName()).toEqual("age");
    });
});
