import { parseIdentifier } from "~/parseIdentifier";

describe("parse identifier", () => {
    const inputs = [
        [
            "aaaaa",
            {
                id: "aaaaa",
                version: null
            }
        ],
        [
            "bbbbb#0001",
            {
                id: "bbbbb",
                version: 1
            }
        ],
        [
            "ccccc#0017",
            {
                id: "ccccc",
                version: 17
            }
        ],
        [
            "ddddd#0917",
            {
                id: "ddddd",
                version: 917
            }
        ],
        [
            "eeeee#7917",
            {
                id: "eeeee",
                version: 7917
            }
        ]
    ];

    test.each(inputs)(`must parse identifier from "%s"`, (identifier: string, expected: any) => {
        const result = parseIdentifier(identifier);

        expect(result).toEqual(expected);
    });
});
