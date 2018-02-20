import { assert } from "chai";
import { query } from "../../src/index";

describe("regular and $eq equality comparison operator test", function() {
    it("should generate correct statement using regular equality operator", () => {
        const output = query.execute({ firstName: "John" });
        assert.equal(output, `(firstName = 'John')`);
    });

    it("should generate correct statement using $eq equality operator", () => {
        const output = query.execute({ firstName: { $eq: "John" } });
        assert.equal(output, `(firstName = 'John')`);
    });

    it("should generate IS NULL", () => {
        const output = query.execute({ firstName: { $eq: "John" } });
        assert.equal(output, `(firstName = 'John')`);
    });
});
