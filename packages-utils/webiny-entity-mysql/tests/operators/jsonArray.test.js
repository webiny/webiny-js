import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

// => if tags=Array, it must contain the value 'preset'
// {tags: 'preset'}

// => if tags=Array, it must contain ONE of the values
// => if tags=scalar, it must equal to one of the array values (no custom handling)
// {tags: {$in: ['preset', 'user']}}

// => if tags=Array, it must match the array elements exactly
// => if tags=scalar, it must equal to one of the array values (no custom handling)
// {tags: ['preset', 'user']}

// => if tags=Array, it must contain ALL of the values
// {tags: {$all: ['preset', 'user']}}

describe("JSON comparison operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("$jsonArrayStrictEquality must create a simple '=' query", () => {
        const output = stmt.getWhere({
            where: { tags: { $jsonArrayStrictEquality: ["user", "avatar"] } }
        });
        assert.equal(output, ` WHERE (tags = JSON_ARRAY('user', 'avatar'))`);
    });

    it("$jsonArrayFindValue must create a JSON_SEARCH query", () => {
        const output = stmt.getWhere({ where: { tags: { $jsonArrayFindValue: "user" } } });
        assert.equal(output, ` WHERE (JSON_SEARCH(tags, 'one', 'user') IS NOT NULL)`);
    });

    it("multiple $jsonArrayFindValue using $or", () => {
        const output = stmt.getWhere({
            where: {
                $or: [
                    { tags: { $jsonArrayFindValue: "user" } },
                    { tags: { $jsonArrayFindValue: "profile" } }
                ]
            }
        });
        assert.equal(
            output,
            ` WHERE ((JSON_SEARCH(tags, 'one', 'user') IS NOT NULL OR JSON_SEARCH(tags, 'one', 'profile') IS NOT NULL))`
        );
    });

    it("multiple $jsonArrayFindValue using $and", () => {
        const output = stmt.getWhere({
            where: {
                $and: [
                    { tags: { $jsonArrayFindValue: "user" } },
                    { tags: { $jsonArrayFindValue: "profile" } }
                ]
            }
        });
        assert.equal(
            output,
            ` WHERE ((JSON_SEARCH(tags, 'one', 'user') IS NOT NULL AND JSON_SEARCH(tags, 'one', 'profile') IS NOT NULL))`
        );
    });
});
