import dateStoragePlugin from "~/dynamoDb/storage/date";

interface CreateDefaultArgsParams {
    fieldId?: string;
    type: string;
}
const createDefaultArgs = ({ fieldId = "fieldId", type }: CreateDefaultArgsParams) => {
    return {
        field: {
            fieldId,
            settings: {
                type
            }
        }
    };
};

const defaultDateArgs = createDefaultArgs({
    type: "date"
});
const defaultTimeArgs = createDefaultArgs({
    type: "time"
});
const defaultDateTimeWithTimezoneArgs = createDefaultArgs({
    type: "dateTimeWithTimezone"
});

describe("dateStoragePlugin", () => {
    const correctToStorageDateValues = [
        [new Date("2021-03-31T13:34:55.000Z"), "2021-03-31T13:34:55.000Z"],
        [new Date("2021-02-22T01:01:01.003Z"), "2021-02-22T01:01:01.003Z"],
        ["2021-01-01T01:01:52.003Z", "2021-01-01T01:01:52.003Z"]
    ];
    test.each(correctToStorageDateValues)(
        "toStorage should transform value for storage",
        async (value: string | Date, expected) => {
            const plugin = dateStoragePlugin();

            const result = await plugin.toStorage({
                ...defaultDateArgs,
                value
            } as any);

            expect(result).toEqual(expected);
        }
    );

    const correctFromStorageDateValues = [
        ["2021-03-31T13:34:55.000Z", new Date("2021-03-31T13:34:55.000Z")],
        ["2021-02-22T01:01:01.003Z", new Date("2021-02-22T01:01:01.003Z")],
        ["2021-01-01T01:01:52.003Z", new Date("2021-01-01T01:01:52.003Z")]
    ];

    test.each(correctFromStorageDateValues)(
        "fromStorage should transform value for output",
        async (value: string | Date, expected) => {
            const plugin = dateStoragePlugin();

            const result = await plugin.fromStorage({
                ...defaultDateArgs,
                value
            } as any);

            expect(result).toEqual(expected);
        }
    );

    it("should not convert time field value", async () => {
        const plugin = dateStoragePlugin();
        const value = "11:34:58";

        const result = await plugin.toStorage({
            ...defaultTimeArgs,
            value
        } as any);

        expect(result).toEqual(value);
    });

    it("should not convert dateTime with tz field value", async () => {
        const plugin = dateStoragePlugin();
        const value = "2021-04-08T13:34:59+0100";

        const result = await plugin.toStorage({
            ...defaultDateTimeWithTimezoneArgs,
            value
        } as any);

        expect(result).toEqual(value);
    });
});
