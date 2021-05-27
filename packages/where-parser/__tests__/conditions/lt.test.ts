import availableConditions from "../../src/conditions";

const supportedValues = [
    ["number", 1],
    ["date", new Date()]
];

const unsupportedValues = [
    ["array", []],
    ["object", {}],
    ["boolean:true", true],
    ["boolean:false", false],
    ["null", null],
    ["string", "text"]
];

describe("condition - lt", () => {
    test.each(supportedValues)(
        "lt should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const ltCondition = availableConditions.get("lt");

            expect(() => {
                ltCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "lt should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const ltCondition = availableConditions.get("lt");

            expect(() => {
                ltCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("LT condition value is of non-supported type.");
        }
    );

    test.each(supportedValues)(
        "not_lt should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const notLtCondition = availableConditions.get("not_lt");

            expect(() => {
                notLtCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_lt should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const notLtCondition = availableConditions.get("not_lt");

            expect(() => {
                notLtCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("LT condition value is of non-supported type.");
        }
    );
});
