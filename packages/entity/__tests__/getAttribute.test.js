import User from "./entities/user";
import { CharAttribute, BooleanAttribute, IntegerAttribute } from "@webiny/model";

describe("getAttribute test", () => {
    test("should return attribute", async () => {
        const user = new User();
        expect(user.getAttribute("firstName")).toBeInstanceOf(CharAttribute);
        expect(user.getAttribute("lastName")).toBeInstanceOf(CharAttribute);
        expect(user.getAttribute("enabled")).toBeInstanceOf(BooleanAttribute);
        expect(user.getAttribute("age")).toBeInstanceOf(IntegerAttribute);
    });

    test("should return undefined because attributes do not exist", async () => {
        const user = new User();
        expect(user.getAttribute("firstName____")).not.toBeDefined();
        expect(user.getAttribute("lastName____")).not.toBeDefined();
        expect(user.getAttribute("enabled____")).not.toBeDefined();
        expect(user.getAttribute("age___")).not.toBeDefined();
    });
});
