import dateStoragePlugin from "../../../../src/dynamoDb/storage/date";

const createDefaultArgs = ({ fieldId = "fieldId", type }) => {
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
        [new Date("2021-03-31T13:34:55.000Z"), "2021-03-31T13:34:55.000Z", 1617197695000],
        [new Date("2021-02-22T01:01:01.003Z"), "2021-02-22T01:01:01.003Z", 1613955661003],
        ["2021-01-01T01:01:52.005Z", "2021-01-01T01:01:52.005Z", 1609462912005]
    ];
    test.each(correctToStorageDateValues)(
        "toStorage should transform value for storage",
        async (value: string | Date, expected: string, milliseconds: number) => {
            const plugin = dateStoragePlugin();

            const result = await plugin.toStorage({
                ...defaultDateArgs,
                value
            } as any);

            expect(result).toEqual({
                c: true,
                t: milliseconds,
                v: expected
            });
        }
    );

    const correctFromStorageDateValues = [
        ["2021-03-31T13:34:55.000Z", 1617197695000, new Date("2021-03-31T13:34:55.000Z")],
        ["2021-02-22T01:01:01.003Z", 1613955661003, new Date("2021-02-22T01:01:01.003Z")],
        ["2021-01-01T01:01:52.005Z", 1609462912005, new Date("2021-01-01T01:01:52.005Z")]
    ];

    test.each(correctFromStorageDateValues)(
        "fromStorage should transform value for output",
        async (value: string | Date, milliseconds: number, expected: string) => {
            const plugin = dateStoragePlugin();

            const result = await plugin.fromStorage({
                ...defaultDateArgs,
                value: {
                    v: value,
                    t: milliseconds,
                    c: true
                }
            } as any);

            expect(result).toEqual(expected);
        }
    );

    it("should convert time field value to a number", async () => {
        const plugin = dateStoragePlugin();
        const value = "11:34:58";

        const result = await plugin.toStorage({
            ...defaultTimeArgs,
            value
        } as any);

        expect(result).toEqual({
            v: value,
            t: 41698
        });
    });

    it("should convert dateTime with tz field value to storage", async () => {
        const plugin = dateStoragePlugin();
        const value = "2021-04-08T13:34:59+0100";

        const result = await plugin.toStorage({
            ...defaultDateTimeWithTimezoneArgs,
            value
        } as any);

        expect(result).toEqual({
            t: 1617885299000,
            v: "2021-04-08T13:34:59+0100",
            c: false
        });
    });

    it("should convert value to storage search - no timezone", () => {
        const plugin = dateStoragePlugin();

        const args: any = {
            ...createDefaultArgs({ fieldId: "dateWithoutTz", type: "date" }),
            model: {} as any,
            value: "2021-03-31T13:34:55.000Z"
        };

        const result = plugin.convertToSearch(args);

        expect(result).toEqual({
            attr: "dateWithoutTz.v",
            value: 1617197695000
        });
    });

    it("should convert value to storage search - with timezone", () => {
        const plugin = dateStoragePlugin();

        const args: any = {
            ...createDefaultArgs({ fieldId: "dateWithTz", type: "date" }),
            model: {} as any,
            value: "2021-03-31T13:34:55+02:00"
        };

        const result = plugin.convertToSearch(args);

        expect(result).toEqual({
            attr: "dateWithTz.v",
            value: 1617190495000
        });
    });
});
