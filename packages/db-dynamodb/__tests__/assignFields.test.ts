import { assignFields } from "~/plugins/assignFields";

describe("assign fields", () => {
    it("should properly assign a single field", () => {
        const result = assignFields("webiny");

        expect(result).toEqual(["webiny"]);
    });

    it("should properly assign multiple fields", () => {
        const result = assignFields(["webiny", "dynamodb"]);

        expect(result).toEqual(["webiny", "dynamodb"]);
    });

    it("should throw an error on empty array item", () => {
        expect(() => {
            assignFields(["webiny", ""]);
        }).toThrow("Passed empty field value into the plugin.");
        expect(() => {
            assignFields([null, "webiny"]);
        }).toThrow("Passed empty field value into the plugin.");
        expect(() => {
            assignFields([undefined, "webiny"]);
        }).toThrow("Passed empty field value into the plugin.");
    });

    it("should throw an error on empty fields array", () => {
        expect(() => {
            assignFields([]);
        }).toThrow("Could not assign fields because there are none.");
    });
});
