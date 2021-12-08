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

describe("condition - lte", () => {
    test.each(supportedValues)(
        "lte should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const lteCondition = availableConditions.get("lte");

            expect(() => {
                lteCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "lte should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const lteCondition = availableConditions.get("lte");

            expect(() => {
                lteCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("LTE condition value is of non-supported type.");
        }
    );

    test.each(supportedValues)(
        "not_lte should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const notLteCondition = availableConditions.get("not_lte");

            expect(() => {
                notLteCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_lte should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const notLteCondition = availableConditions.get("not_lte");

            expect(() => {
                notLteCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("LTE condition value is of non-supported type.");
        }
    );
});
