import User from "./entities/user";
import { EntityError } from "@webiny/entity";

describe("default driver test", () => {
    test("save method should return the same user instance", async () => {
        const user = new User();
        const res = await user.save();
        expect(res).not.toBeDefined();
    });

    test("delete method should return undefined", async () => {
        const user = new User();

        let error = null;
        try {
            await user.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(EntityError);
        expect(error.code).toEqual(EntityError.CANNOT_DELETE_NO_ID);

        user.id = "ABC";
        expect(await user.delete()).not.toBeDefined();
    });

    test("findById method should return null", async () => {
        const user = await User.findById(12345);
        expect(user).toBeNull();
    });

    test("findByIds method should return null", async () => {
        const users = await User.findByIds([1, 2, 3]);
        expect(users.length).toBe(0);
    });

    test("findOne method should return null", async () => {
        const user = await User.findOne({ query: { id: 12345 } });
        expect(user).toBeNull();
    });

    test("find method should return empty array", async () => {
        const users = await User.find({ query: 12345 });
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBe(0);
    });

    test("count method should return zero", async () => {
        expect(await User.count()).toEqual(0);
    });

    test("getConnection must return null (since default driver does not have a connection)", async () => {
        expect(User.getDriver().getConnection()).toEqual(null);

        User.getDriver().connection = "Connection";
        expect(User.getDriver().getConnection()).toEqual("Connection");
    });
});
