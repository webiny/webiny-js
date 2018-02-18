import { assert } from "chai";
import { operatorsProcessor } from "../../../../src/processors";

describe("regular and $eq equality comparison operator test", function() {
    it("if array of values was passed, must use the IN operator", () => {
        const output = operatorsProcessor.execute({ firstName: ["John", "doe", 1, 2, 3] });
        assert.equal(output, `(firstName IN('John', 'doe', 1, 2, 3))`);
    });

    it("if values were passed with $in operator, must use the IN operator", () => {
        const output = operatorsProcessor.execute({ firstName: { $in: ["John", "doe", 1, 2, 3] } });
        assert.equal(output, `(firstName IN('John', 'doe', 1, 2, 3))`);
    });
});
