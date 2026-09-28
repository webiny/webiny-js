import { describe, expect, it } from "vitest";
import { rewriteImageSources, tallyImageSources } from "./rewriteImageSources.js";

const CLOUDINARY = "https://res.cloudinary.com/g5/image/upload/hero.jpg";
const WEBINY = "https://cdn.webiny/abc-123/hero.webp";

const bindings = (value: unknown, type = "file"): Record<string, any> => ({
    "el-1": { inputs: { "images/0/src": { static: value, type } } }
});

const resolve = (url: string) => (url === CLOUDINARY ? WEBINY : null);

describe("rewriteImageSources", () => {
    it("repoints an object-shaped binding and keeps it an object", () => {
        const result = rewriteImageSources({ bindings: bindings({ url: CLOUDINARY }), resolve });

        expect(result.bindings["el-1"].inputs["images/0/src"].static).toEqual({ url: WEBINY });
        expect(result.outcomes).toEqual([
            {
                kind: "rewritten",
                elementId: "el-1",
                path: "images/0/src",
                from: CLOUDINARY,
                to: WEBINY
            }
        ]);
    });

    it("repoints a string-shaped binding and keeps it a string", () => {
        // The shape is what decides whether that component renders anything at all, so a rewrite must
        // never change it — a value-passing component handed an object renders "[object Object]".
        const result = rewriteImageSources({ bindings: bindings(CLOUDINARY), resolve });

        expect(result.bindings["el-1"].inputs["images/0/src"].static).toBe(WEBINY);
    });

    it("keeps a `src`-keyed object on its own key", () => {
        const result = rewriteImageSources({
            bindings: bindings({ src: CLOUDINARY, width: 10 }),
            resolve
        });

        expect(result.bindings["el-1"].inputs["images/0/src"].static).toEqual({
            src: WEBINY,
            width: 10
        });
    });

    it("leaves an image with no migrated copy alone, and records it", () => {
        const url = "https://elsewhere.example/not-migrated.png";
        const result = rewriteImageSources({ bindings: bindings({ url }), resolve });

        expect(result.bindings["el-1"].inputs["images/0/src"].static).toEqual({ url });
        expect(result.outcomes).toEqual([
            { kind: "unmigrated", elementId: "el-1", path: "images/0/src", url }
        ]);
    });

    it("ignores a binding that is not file-typed", () => {
        const result = rewriteImageSources({ bindings: bindings(CLOUDINARY, "text"), resolve });

        expect(result.bindings["el-1"].inputs["images/0/src"].static).toBe(CLOUDINARY);
        expect(result.outcomes).toEqual([]);
    });

    it("passes over an empty slot without calling it missing", () => {
        const emptied = rewriteImageSources({ bindings: bindings(null), resolve });
        const blank = rewriteImageSources({ bindings: bindings({ url: "" }), resolve });

        expect(emptied.outcomes).toEqual([]);
        expect(blank.outcomes).toEqual([]);
    });

    it("counts outcomes for the page map", () => {
        const result = rewriteImageSources({
            bindings: {
                "el-1": {
                    inputs: {
                        a: { static: { url: CLOUDINARY }, type: "file" },
                        b: { static: { url: "https://elsewhere/x.png" }, type: "file" }
                    }
                }
            },
            resolve
        });

        expect(tallyImageSources(result.outcomes)).toEqual({ rewritten: 1, unmigrated: 1 });
    });
});
