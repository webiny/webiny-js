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

describe("condition - gt", () => {
    test.each(supportedValues)(
        "gt should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const gtCondition = availableConditions.get("gt");

            expect(() => {
                gtCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "gt should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const gtCondition = availableConditions.get("gt");

            expect(() => {
                gtCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("GT condition value is of non-supported type.");
        }
    );

    test.each(supportedValues)(
        "not_gt should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const notGtCondition = availableConditions.get("not_gt");

            expect(() => {
                notGtCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_gt should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const notGtCondition = availableConditions.get("not_gt");

            expect(() => {
                notGtCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow("GT condition value is of non-supported type.");
        }
    );
});
