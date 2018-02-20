import { assert } from "chai";
import { query } from "../../src/index";

describe("regular and $ne equality comparison operator test", function() {
    it("should generate correct statement using $ne equality operator", () => {
        const output = query.execute({ firstName: { $ne: "John" } });
        assert.equal(output, `(firstName <> 'John')`);
    });

    it("should generate IS NULL", () => {
        const output = query.execute({ deletedOn: { $ne: null } });
        assert.equal(output, `(deletedOn IS NOT NULL)`);
    });
});
