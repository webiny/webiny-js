import User from "./entities/user";
import { CharAttribute, BooleanAttribute, IntegerAttribute, FloatAttribute } from "@webiny/model";

describe("getAttributes test", () => {
    test("should return all attributes", async () => {
        const user = new User();

        const allAttributes = user.getAttributes();

        expect(Object.keys(allAttributes)).toContainAllValues([
            "dynamicWithArgs",
            "firstName",
            "lastName",
            "enabled",
            "age",
            "totalSomething",
            "id"
        ]);
        expect(allAttributes["firstName"]).toBeInstanceOf(CharAttribute);
        expect(allAttributes["lastName"]).toBeInstanceOf(CharAttribute);
        expect(allAttributes["enabled"]).toBeInstanceOf(BooleanAttribute);
        expect(allAttributes["age"]).toBeInstanceOf(IntegerAttribute);
        expect(allAttributes["totalSomething"]).toBeInstanceOf(IntegerAttribute);
        expect(allAttributes["dynamicWithArgs"]).toBeInstanceOf(FloatAttribute);
    });
});
