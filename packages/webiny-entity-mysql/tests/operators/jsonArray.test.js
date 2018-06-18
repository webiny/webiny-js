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

describe("JSON comparison operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("$jsonArrayStrictEquality must create a simple '=' query", () => {
        const output = stmt.getWhere({
            where: { tags: { $jsonArrayStrictEquality: ["user", "avatar"] } }
        });
        expect(output).toEqual(` WHERE (\`tags\` = JSON_ARRAY('user', 'avatar'))`);
    });

    test("$jsonArrayFindValue must create a JSON_SEARCH query", () => {
        const output = stmt.getWhere({ where: { tags: { $jsonArrayFindValue: "user" } } });
        expect(output).toEqual(` WHERE (JSON_SEARCH(\`tags\`, 'one', 'user') IS NOT NULL)`);
    });

    test("multiple $jsonArrayFindValue using $or", () => {
        const output = stmt.getWhere({
            where: {
                $or: [
                    { tags: { $jsonArrayFindValue: "user" } },
                    { tags: { $jsonArrayFindValue: "profile" } }
                ]
            }
        });
        expect(output).toEqual(
            ` WHERE ((JSON_SEARCH(\`tags\`, 'one', 'user') IS NOT NULL OR JSON_SEARCH(\`tags\`, 'one', 'profile') IS NOT NULL))`
        );
    });

    test("multiple $jsonArrayFindValue using $and", () => {
        const output = stmt.getWhere({
            where: {
                $and: [
                    { tags: { $jsonArrayFindValue: "user" } },
                    { tags: { $jsonArrayFindValue: "profile" } }
                ]
            }
        });
        expect(output).toEqual(
            ` WHERE ((JSON_SEARCH(\`tags\`, 'one', 'user') IS NOT NULL AND JSON_SEARCH(\`tags\`, 'one', 'profile') IS NOT NULL))`
        );
    });
});
