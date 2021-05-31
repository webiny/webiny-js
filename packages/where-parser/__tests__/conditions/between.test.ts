import availableConditions from "../../src/conditions";

const supportedValues = [[[1, 4]]];

const unsupportedValues = [
    ["number", 1],
    ["string", "text"],
    ["date", new Date()],
    ["boolean:true", true],
    ["boolean:false", false],
    ["null", null],
    ["array:0", []],
    ["array:1", [1]],
    ["array:3", [1, 2, 3]],
    ["object", {}]
];

describe("condition - between", () => {
    test.each(supportedValues)(
        "between should not throw an error on validation when value is supported",
        (value: any) => {
            const betweenCondition = availableConditions.get("between");

            expect(() => {
                betweenCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "between should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const betweenCondition = availableConditions.get("between");

            expect(() => {
                betweenCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );

    test.each(supportedValues)(
        "not_between should not throw an error on validation when value is supported",
        (value: any) => {
            const notBetweenCondition = availableConditions.get("not_between");

            expect(() => {
                notBetweenCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_between should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const notBetweenCondition = availableConditions.get("not_between");

            expect(() => {
                notBetweenCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );
});
