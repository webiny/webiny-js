import { createTimeSearchPlugin } from "~/elasticsearch/search/timeSearch";
import { TransformCallableParams } from "~/plugins";

const timeField = {
    settings: {
        type: "time"
    }
};

const notTimeField = {
    settings: {
        type: "date"
    }
};

describe("timeSearch", () => {
    const plugin = createTimeSearchPlugin();

    const correctValues = [
        ["01:02:03", 3723],
        ["13:45:55", 49555],
        ["23:59:59", 86399]
    ];
    test.each(correctValues)("should transform value correctly", (value, expected) => {
        const result = plugin.transform({
            field: timeField,
            value
        } as TransformCallableParams);

        expect(result).toEqual(expected);
    });

    it("should return passed value as it is not time field", () => {
        const result = plugin.transform({
            field: notTimeField,
            value: "someValue"
        } as TransformCallableParams);

        expect(result).toEqual("someValue");
    });

    it("should be targeting datetime field", () => {
        expect(plugin.fieldType).toEqual("datetime");
    });
});
