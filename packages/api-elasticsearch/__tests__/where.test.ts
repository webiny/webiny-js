import { parseWhereKey, ParseWhereKeyResult } from "~/where";

describe("where", () => {
    const whereKeys: [string, ParseWhereKeyResult][] = [
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
        ],
        [
            "wbyAco_location",
            {
                field: "wbyAco_location",
                operator: "eq"
            }
        ],
        [
            "wbyAco_location_in",
            {
                field: "wbyAco_location",
                operator: "in"
            }
        ],
        [
            "wbyAco_location_not_in",
            {
                field: "wbyAco_location",
                operator: "not_in"
            }
        ]
    ];

    test.each(whereKeys)(
        "parse should result in field and operator values - %s",
        (key, expected) => {
            const result = parseWhereKey(key as unknown as string);

            expect(result).toEqual(expected);
        }
    );

    const malformedWhereKeys: string[][] = [["_a"], ["_"], ["__"], ["a_"]];

    test.each(malformedWhereKeys)(
        `should throw error when malformed key is passed "%s"`,
        (key: string) => {
            expect(() => {
                parseWhereKey(key);
            }).toThrow(`It is not possible to search by key "${key}"`);
        }
    );
});
