import { parseWhereKey } from "~/where";

describe("where", () => {
    const whereKeys = [
        [
            "id",
            {
                field: "id",
                operator: "eq"
            }
        ],
        [
            "id_in",
            {
                field: "id",
                operator: "in"
            }
        ],
        [
            "id_not_in",
            {
                field: "id",
                operator: "not_in"
            }
        ]
    ];

    test.each(whereKeys)(
        "parse should result in field and operator values",
        (key: string, expected: any) => {
            const result = parseWhereKey(key);

            expect(result).toEqual(expected);
        }
    );

    const malformedWhereKeys = [["_a"], ["_"], ["__"], ["a_"]];

    test.each(malformedWhereKeys)(
        `should throw error when malformed key is passed "%s"`,
        (key: string) => {
            expect(() => {
                parseWhereKey(key);
            }).toThrow(`It is not possible to search by key "${key}"`);
        }
    );

    test("should throw error when malformed field is parsed out", () => {
        const key = "a0_in";
        expect(() => {
            parseWhereKey(key);
        }).toThrow(`Cannot filter by "a0".`);
    });
});
