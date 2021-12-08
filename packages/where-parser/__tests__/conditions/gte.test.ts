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

describe("condition - gte", () => {
    test.each(supportedValues)(
        "gte should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const gteCondition = availableConditions.get("gte");

            expect(() => {
                gteCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "gte should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const gteCondition = availableConditions.get("gte");

            expect(() => {
                gteCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("GTE condition value is of non-supported type.");
        }
    );

    test.each(supportedValues)(
        "not_gte should not throw an error on validation when value is supported - %s",
        (_name: string, value: any) => {
            const notGteCondition = availableConditions.get("not_gte");

            expect(() => {
                notGteCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_gte should throw an error on validation when value is not supported - %s",
        (_name: string, value: any) => {
            const notGteCondition = availableConditions.get("not_gte");

            expect(() => {
                notGteCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("GTE condition value is of non-supported type.");
        }
    );
});
