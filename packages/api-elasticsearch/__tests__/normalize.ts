import { normalizeValue } from "~/normalize";

describe(`GraphQL "contains" operator - query normalization`, () => {
    test("must properly escape ES reserved characters", async () => {
        expect(normalizeValue("Sembach Germany")).toBe("Sembach Germany");
        expect(normalizeValue("Sembach\\Germany")).toBe("Sembach Germany");
        expect(normalizeValue("AE0003 - VFW Post 12139 Donnersberg, Sembach-Germany")).toBe(
            "AE0003   VFW Post 12139 Donnersberg, Sembach Germany"
        );

        expect(normalizeValue('+ 1 - = && || > < ! ( A ) { } [ ] ^ " ~ * ? : \\ 2 /')).toBe(
            "  1                 A                         2"
        );
    });
});
