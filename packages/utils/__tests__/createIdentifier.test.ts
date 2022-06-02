import { createIdentifier } from "~/createIdentifier";

describe("create identifier", () => {
    const inputs: [string, number, string][] = [
        ["aaaaa", 1, "aaaaa#0001"],
        ["bbbbb#0005", 17, "bbbbb#0017"],
        ["ccccc#0018", 319, "ccccc#0319"],
        ["ddddd#0501", 7049, "ddddd#7049"]
    ];

    test.each(inputs)(`must create full identifier from "%s" and "%s"`, (id, version, expected) => {
        const result = createIdentifier({
            id,
            version
        });

        expect(result).toEqual(expected);
    });
});
