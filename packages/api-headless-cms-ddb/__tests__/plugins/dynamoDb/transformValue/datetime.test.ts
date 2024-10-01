import { createDatetimeTransformValuePlugin } from "~/dynamoDb/transformValue/datetime";
import { CmsModelField } from "@webiny/api-headless-cms/types";

const createField = (fieldType: string): CmsModelField => {
    return {
        id: "storageId",
        storageId: "storageId",
        type: "datetime",
        settings: {
            type: fieldType
        }
    } as unknown as CmsModelField;
};

describe("dynamodb transform datetime", () => {
    const correctValues: [string | Date, string, number][] = [
        [new Date("Thu, 13 May 2021 12:32:33.892 GMT"), "date", 1620909153892],
        [new Date("2021-05-13T12:32:33.892Z"), "date", 1620909153892],
        ["2021-05-13T12:32:33.892Z", "date", 1620909153892],
        ["13:57:22", "time", 50242000],
        ["13:57", "time", 50220000],
        ["13:57.481", "time", 50220481],
        ["13:57:22.581", "time", 50242581]
    ];
    test.each(correctValues)(
        "should transform date or time into the milliseconds - %s",
        (value: Date | string, fieldType: string, expected: number) => {
            const plugin = createDatetimeTransformValuePlugin();

            const result = plugin.transform({
                field: createField(fieldType),
                value
            });

            expect(result).toEqual(expected);
        }
    );

    const incorrectTimeValues: [any][] = [
        [{}],
        [[]],
        [""],
        [
            function () {
                return 1;
            }
        ],
        [true]
    ];

    test.each(incorrectTimeValues)(
        "should throw an error when trying to transform time field but value is not a string or a number",
        value => {
            expect.assertions(1);
            const plugin = createDatetimeTransformValuePlugin();

            try {
                const result = plugin.transform({
                    field: createField("time"),
                    value
                });
                expect(result).toEqual("SHOULD NOT HAPPEN");
            } catch (ex) {
                expect(ex.message).toEqual(
                    "Field value must be a string because field is defined as time."
                );
            }
        }
    );
});
