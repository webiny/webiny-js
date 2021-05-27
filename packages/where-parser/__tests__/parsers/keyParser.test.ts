import { keyParser } from "../../src/parsers/keyParser";

const correctTestValues = [
    ["id", "id", "eq"],
    ["id_eq", "id", "eq"],
    ["id_not_eq", "id", "not_eq"],
    ["someLongKey_gt", "someLongKey", "gt"],
    ["someLongKey_not_gt", "someLongKey", "not_gt"],
    ["someLongKey_not_gte", "someLongKey", "not_gte"],
    ["anotherEvenLongerKey_not_lt", "anotherEvenLongerKey", "not_lt"],
    ["anotherEvenLongerKey_not_gte", "anotherEvenLongerKey", "not_gte"],
    ["text_contains", "text", "contains"],
    ["text_not_contains", "text", "not_contains"],
    ["id_in", "id", "in"],
    ["id_not_in", "id", "not_in"],
    ["date_between", "date", "between"],
    ["date_not_between", "date", "not_between"]
];

const errorMsgFormat = "Wrong format of the filter key";
const errorMessageKeyword = "Unsupported keyword on the filter key.";

const incorrectTestValues = [
    ["some_long_string_contains", errorMsgFormat],
    ["some_long_contains", errorMessageKeyword],
    ["some_long_eq_not", errorMsgFormat]
];

describe("key parser", () => {
    test.each(correctTestValues)(
        "should parse key correctly - %s -> [%s, %s]",
        (target: string, expectedAttr: string, expectedOperation: string) => {
            const { attr, operation } = keyParser(target);

            expect(attr).toEqual(expectedAttr);
            expect(operation).toEqual(expectedOperation);
        }
    );

    test.each(incorrectTestValues)(
        "should throw error on wrong key - %s",
        (target: string, message: string) => {
            expect(() => {
                keyParser(target);
            }).toThrow(message);
        }
    );
});
