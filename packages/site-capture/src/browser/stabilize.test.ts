import { describe, it, expect } from "vitest";
import { summarizeFontFaces } from "./stabilize.js";

describe("summarizeFontFaces", () => {
    it("reports nothing when every face loaded", () => {
        expect(
            summarizeFontFaces(
                [
                    { family: "Inter", status: "loaded" },
                    { family: '"Playfair Display"', status: "loaded" }
                ],
                true
            )
        ).toEqual({ ready: true, failed: [], pending: [] });
    });

    it("reports a face that failed, once per family, without quotes", () => {
        expect(
            summarizeFontFaces(
                [
                    { family: '"Brand Sans"', status: "error" },
                    { family: '"Brand Sans"', status: "error" },
                    { family: "Inter", status: "loaded" }
                ],
                true
            )
        ).toEqual({ ready: true, failed: ["Brand Sans"], pending: [] });
    });

    it("reports a face still loading when the wait ran out", () => {
        expect(summarizeFontFaces([{ family: "Slow Serif", status: "loading" }], false)).toEqual({
            ready: false,
            failed: [],
            pending: ["Slow Serif"]
        });
    });

    it("does not report a face nothing asked for", () => {
        expect(summarizeFontFaces([{ family: "Unused", status: "unloaded" }], true)).toEqual({
            ready: true,
            failed: [],
            pending: []
        });
    });

    it("lists a family under failed only, when one of its faces failed and another is loading", () => {
        expect(
            summarizeFontFaces(
                [
                    { family: "Brand", status: "error" },
                    { family: "Brand", status: "loading" }
                ],
                false
            )
        ).toEqual({ ready: false, failed: ["Brand"], pending: [] });
    });
});
