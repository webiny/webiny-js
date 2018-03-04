import { assert, expect } from "chai";
import Statement from "../../src/statements/statement";
import { operators } from "../../src";

describe("$and logical operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators });
    });

    it("should generate correct statement", () => {
        const output = stmt.getWhere({ where: { firstName: "John", lastName: "Doe", age: 35 } });
        assert.equal(output, ` WHERE (firstName = 'John' AND lastName = 'Doe' AND age = 35)`);
    });

    it("should generate correct statement with nested $and operators", () => {
        const output = stmt.getWhere({
            where: {
                firstName: "John",
                lastName: "Doe",
                $and: { age: 35, height: 6.2, weight: 225 }
            }
        });
        assert.equal(
            output,
            ` WHERE (firstName = 'John' AND lastName = 'Doe' AND (age = 35 AND height = 6.2 AND weight = 225))`
        );
    });

    it("should throw Error because values are in invalid format", () => {
        expect(() => {
            stmt.getWhere({
                where: {
                    $or: {
                        firstName: "John",
                        lastName: "Doe",
                        $and: "*** THIS IS AN INVALID FORMAT ***"
                    }
                }
            });
        }).to.throw();
    });

    it("should generate correct statement with nested $and operators but with values in an array", () => {
        const output = stmt.getWhere({
            where: {
                firstName: "John",
                lastName: "Doe",
                $and: [{ age: 35 }, { age: 50 }, { height: 6.2, weight: 225 }]
            }
        });

        assert.equal(
            output,
            ` WHERE (firstName = 'John' AND lastName = 'Doe' AND (age = 35 AND age = 50 AND height = 6.2 AND weight = 225))`
        );
    });
});
