import availableConditions from "../../src/conditions";

const supportedValues = [
    ["number", 1],
    ["string", "text"]
];

const unsupportedValues = [
    ["date", new Date()],
    ["boolean:true", true],
    ["boolean:false", false],
    ["null", null],
    ["array:0", []],
    ["array:1", [1]],
    ["array:3", [1, 2, 3]],
    ["object", {}]
];

describe("condition - contains", () => {
    test.each(supportedValues)(
        "contains should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const containsCondition = availableConditions.get("contains");

            expect(() => {
                containsCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "contains should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const containsCondition = availableConditions.get("contains");

            expect(() => {
                containsCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );

    test.each(supportedValues)(
        "not_contains should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const notContainsCondition = availableConditions.get("not_contains");

            expect(() => {
                notContainsCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_contains should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const notContainsCondition = availableConditions.get("not_contains");

            expect(() => {
                notContainsCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );
});
