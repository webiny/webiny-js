import { createDateStorageTransformPlugin } from "~/dynamoDb/storage/date";
import { ToStorageParams } from "@webiny/api-headless-cms";

const createDefaultArgs = ({ storageId = "storageId", type = "", multipleValues = false }) => {
    return {
        field: {
            storageId,
            settings: {
                type
            },
            multipleValues
        }
    };
};

const defaultDateArgs = createDefaultArgs({
    type: "date"
});
const defaultDateMultipleArgs = createDefaultArgs({
    type: "date",
    multipleValues: true
});
const defaultTimeArgs = createDefaultArgs({
    type: "time"
});
const defaultDateTimeWithTimezoneArgs = createDefaultArgs({
    type: "dateTimeWithTimezone"
});

describe("dateStoragePlugin", () => {
    const correctSingleToStorageDateValues = [
        [new Date("2021-03-31T13:34:55.000Z"), "2021-03-31T13:34:55.000Z"],
        [new Date("2021-02-22T01:01:01.003Z"), "2021-02-22T01:01:01.003Z"],
        ["2021-01-01T01:01:52.003Z", "2021-01-01T01:01:52.003Z"]
    ];
    test.each(correctSingleToStorageDateValues)(
        "toStorage should transform single value for storage",
        async (value, expected) => {
            const plugin = createDateStorageTransformPlugin();

            const result = await plugin.toStorage({
                ...defaultDateArgs,
                value
            } as ToStorageParams<any, any>);

            expect(result).toEqual(expected);
        }
    );

    const correctMultipleToStorageDateValues = [
        [
            [new Date("2021-03-31T13:34:55.000Z"), new Date("2021-03-31T14:34:55.000Z")],
            ["2021-03-31T13:34:55.000Z", "2021-03-31T14:34:55.000Z"]
        ],
        [
            [new Date("2021-02-22T01:01:01.003Z"), new Date("2021-02-22T02:01:01.003Z")],
            ["2021-02-22T01:01:01.003Z", "2021-02-22T02:01:01.003Z"]
        ],
        [
            ["2021-01-01T01:01:52.003Z", "2021-01-01T05:01:52.003Z"],
            ["2021-01-01T01:01:52.003Z", "2021-01-01T05:01:52.003Z"]
        ]
    ];
    test.each(correctMultipleToStorageDateValues)(
        "toStorage should transform multiple value for storage",
        async (value, expected) => {
            const plugin = createDateStorageTransformPlugin();

            const result = await plugin.toStorage({
                ...defaultDateMultipleArgs,
                value
            } as ToStorageParams<any, any>);

            expect(result).toEqual(expected);
        }
    );

    const correctSingleFromStorageDateValues: [string, Date][] = [
        ["2021-03-31T13:34:55.000Z", new Date("2021-03-31T13:34:55.000Z")],
        ["2021-02-22T01:01:01.003Z", new Date("2021-02-22T01:01:01.003Z")],
        ["2021-01-01T01:01:52.003Z", new Date("2021-01-01T01:01:52.003Z")]
    ];

    test.each(correctSingleFromStorageDateValues)(
        "fromStorage should transform single value for output",
        async (value, expected) => {
            const plugin = createDateStorageTransformPlugin();

            const result = await plugin.fromStorage({
                ...defaultDateArgs,
                value
            } as ToStorageParams<any, any>);

            expect(result).toEqual(expected);
        }
    );

    const correctMultipleFromStorageDateValues: [string[], Date[]][] = [
        [
            ["2021-03-31T13:34:55.000Z", "2021-03-31T14:34:55.000Z"],
            [new Date("2021-03-31T13:34:55.000Z"), new Date("2021-03-31T14:34:55.000Z")]
        ],
        [
            ["2021-02-22T01:01:01.003Z", "2021-02-22T02:01:01.003Z"],
            [new Date("2021-02-22T01:01:01.003Z"), new Date("2021-02-22T02:01:01.003Z")]
        ],
        [
            ["2021-01-01T01:01:52.003Z", "2021-01-01T14:01:52.003Z"],
            [new Date("2021-01-01T01:01:52.003Z"), new Date("2021-01-01T14:01:52.003Z")]
        ]
    ];

    test.each(correctMultipleFromStorageDateValues)(
        "fromStorage should transform multiple value for output",
        async (value, expected) => {
            const plugin = createDateStorageTransformPlugin();

            const result = await plugin.fromStorage({
                ...defaultDateMultipleArgs,
                value
            } as ToStorageParams<any, any>);

            expect(result).toEqual(expected);
        }
    );

    it("should not convert time field value", async () => {
        const plugin = createDateStorageTransformPlugin();
        const value = "11:34:58";

        const result = await plugin.toStorage({
            ...defaultTimeArgs,
            value
        } as ToStorageParams<any, any>);

        expect(result).toEqual(value);
    });

    it("should not convert dateTime with tz field value", async () => {
        const plugin = createDateStorageTransformPlugin();
        const value = "2021-04-08T13:34:59+0100";

        const result = await plugin.toStorage({
            ...defaultDateTimeWithTimezoneArgs,
            value
        } as ToStorageParams<any, any>);

        expect(result).toEqual(value);
    });
});
