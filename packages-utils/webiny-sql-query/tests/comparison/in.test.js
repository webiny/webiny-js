import { assert } from "chai";
import { query } from "../../src/index";

describe("regular and $eq equality comparison operator test", function() {
    it("if array of values was passed, must use the IN operator", () => {
        const output = query.execute({ firstName: ["John", "doe", 1, 2, 3] });
        assert.equal(output, `(firstName IN('John', 'doe', 1, 2, 3))`);
    });

    it("if values were passed with $in operator, must use the IN operator", () => {
        const output = query.execute({ firstName: { $in: ["John", "doe", 1, 2, 3] } });
        assert.equal(output, `(firstName IN('John', 'doe', 1, 2, 3))`);
    });
});
