import { validation } from "webiny-validation";
import "./chai";

describe("numeric test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "numeric").should.be.fulfilled;
    });

    it("should fail - values are not numerics", () => {
        const values = [NaN, true, [], "asd", "{}", {}, "123._", "11.x", "11.a3211"];

        return Promise.all(
            values.map(value => {
                return validation.validate(value, "numeric").should.be.rejected;
            })
        );
    });

    it("should pass - valid numerics given", () => {
        return Promise.all([
            validation.validate(11, "numeric").should.become(true),
            validation.validate(11.434242, "numeric").should.become(true)
        ]);
    });
});
