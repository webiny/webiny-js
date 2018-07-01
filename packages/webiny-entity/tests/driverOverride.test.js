import User from "./entities/user";
import { Driver, Entity } from "webiny-entity";

describe("driver override test", () => {
    test("should use basic driver", async () => {
        const user = new User();
        expect(user.getDriver()).toBeInstanceOf(Driver);
    });

    test("should use CustomDriver override", async () => {
        class CustomUser extends Entity {}
        class CustomDriver extends Driver {}

        CustomUser.driver = new CustomDriver();
        expect(CustomUser.getDriver()).toBeInstanceOf(CustomDriver);
    });
});
