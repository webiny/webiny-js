import availableConditions from "../../src/conditions";

const supportedValues = [
    ["good", [1, 2]],
    ["array:1", [1]],
    ["array:3", [1, 2, 3]]
];

const unsupportedValues = [
    ["string", "text"],
    ["date", new Date()],
    ["boolean:true", true],
    ["boolean:false", false],
    ["null", null],
    ["array:0", []],
    ["array:null", [null]],
    ["object", {}]
];

describe("condition - in", () => {
    test.each(supportedValues)(
        "in should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const inCondition = availableConditions.get("in");

            expect(() => {
                inCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "eq should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const inCondition = availableConditions.get("in");

            expect(() => {
                inCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );

    test.each(supportedValues)(
        "not_in should not throw an error on validation when value is supported - %s",
        (name: string, value: any) => {
            const notInCondition = availableConditions.get("not_in");

            expect(() => {
                notInCondition.validate({
                    attr: "id",
                    value
                });
            }).not.toThrow();
        }
    );

    test.each(unsupportedValues)(
        "not_in should throw an error on validation when value is not supported - %s",
        (name: string, value: any) => {
            const notInCondition = availableConditions.get("not_in");

            expect(() => {
                notInCondition.validate({
                    attr: "id",
                    value
                });
            }).toThrow();
        }
    );
});
