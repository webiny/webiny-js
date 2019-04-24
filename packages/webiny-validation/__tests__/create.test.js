import { validation } from "webiny-validation";
import "./chai";

describe("create test", () => {
    it("should create async validator function", async () => {
        const validate = validation.create("email");
        try {
            await validate("test@webiny");
        } catch (e) {
            expect(e.message).toBe("Value must be a valid e-mail address.");
            return;
        }
        throw Error(`Error should've been thrown.`);
    });

    it("should create sync validator function", () => {
        const validate = validation.createSync("email");
        try {
            validate("test@webiny");
        } catch (e) {
            expect(e.message).toBe("Value must be a valid e-mail address.");
            return;
        }
        throw Error(`Error should've been thrown.`);
    });
});
