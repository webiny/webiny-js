import timeSearch from "../../../../src/elasticsearch/search/timeSearch";

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
    const plugin = timeSearch();
    const context: any = {};

    const correctValues = [
        ["01:02:03", 3723],
        ["13:45:55", 49555],
        ["23:59:59", 86399]
    ];
    test.each(correctValues)(
        "should transform value correctly",
        (value: string, expected: number) => {
            const result = plugin.transform({
                context,
                field: timeField as any,
                value
            });

            expect(result).toEqual(expected);
        }
    );

    it("should return passed value as it is not time field", () => {
        const result = plugin.transform({
            context,
            field: notTimeField as any,
            value: "someValue"
        });

        expect(result).toEqual("someValue");
    });

    it("should be targeting datetime field", () => {
        expect(plugin.fieldType).toEqual("datetime");
    });
});
