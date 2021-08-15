import availableConditions from "../../src/conditions";

const supportedValues = [
    ["number", 1],
    ["string", "text"],
    ["date", new Date()],
    ["boolean:true", true],
    ["boolean:false", false],
    ["null", null]
];

const unsupportedValues = [
    ["array", []],
    ["object", {}]
];

describe("condition - eq", () => {
    test.each(supportedValues)(
        "eq should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const eqCondition = availableConditions.get("eq");

            expect(() => {
                eqCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "eq should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const eqCondition = availableConditions.get("eq");

            expect(() => {
                eqCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("EQ condition value is of non-supported type.");
        }
    );

    test.each(supportedValues)(
        "not_eq should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const notEqCondition = availableConditions.get("not_eq");

            expect(() => {
                notEqCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_eq should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const notEqCondition = availableConditions.get("not_eq");

            expect(() => {
                notEqCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("EQ condition value is of non-supported type.");
        }
    );
});
