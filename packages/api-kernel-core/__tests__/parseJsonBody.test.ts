import { describe, it, expect } from "vitest";
import { parseJsonBody } from "~/features/http/parseJsonBody.js";

describe("parseJsonBody", () => {
    it("parses JSON like JSON.parse", () => {
        expect(parseJsonBody('{"a":1,"b":[{"c":"d"}],"constructor":"x"}')).toEqual({
            a: 1,
            b: [{ c: "d" }],
            constructor: "x"
        });
    });

    it("rejects a __proto__ key at any depth", () => {
        expect(() => parseJsonBody('{"__proto__":{"polluted":true}}')).toThrow(SyntaxError);
        expect(() => parseJsonBody('{"a":{"__proto__":{"polluted":true}}}')).toThrow(SyntaxError);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("rejects a constructor.prototype key", () => {
        expect(() => parseJsonBody('{"constructor":{"prototype":{"polluted":true}}}')).toThrow(
            SyntaxError
        );
    });
});
