import { describe, expect, it } from "vitest";
import { normalizeValue } from "~/normalize.js";

describe(`GraphQL "contains" operator - query normalization`, () => {
    it("must properly escape ES reserved characters", async () => {
        expect(normalizeValue("Sembach Germany")).toBe("Sembach Germany");
        expect(normalizeValue("Sembach\\Germany")).toBe("Sembach Germany");
        expect(normalizeValue("AE0003 - VFW Post 12139 Donnersberg, Sembach-Germany")).toBe(
            "AE0003   VFW Post 12139 Donnersberg, Sembach Germany"
        );

        expect(normalizeValue("Climbing 11/14")).toBe("Climbing 11 14");
        expect(normalizeValue("Terms AND/OR conditions")).toBe("Terms and or conditions");
        expect(normalizeValue("Rock NOT Roll")).toBe("Rock not Roll");
        expect(normalizeValue("ANDROID ORBIT NOTE")).toBe("ANDROID ORBIT NOTE");

        // expect(normalizeValue('+ 1 - = && || > < ! ( A ) { } [ ] ^ " ~ * ? : \\ 2 /')).toEqual(
        //     "\\+ 1   \\= \&\& \\|\\| \> \< \! \\( A \\) \\{ \\} \\[ \\] \\^ \\\" \\~ \\*  \:   2 \/"
        // );
    });
});
