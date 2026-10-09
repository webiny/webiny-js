import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { themeFit } from "./themeFit.js";

const component = (extra: Partial<PlannedComponent>) =>
    ({
        name: "Footer",
        representative: { resolvedColours: [] },
        typeScale: [],
        ...extra
    }) as unknown as PlannedComponent;

describe("themeFit", () => {
    it("counts a colour as fitted only when its token is of its own family", () => {
        const fit = themeFit([
            component({
                representative: {
                    resolvedColours: [
                        {
                            role: "text",
                            hex: "#ffffff",
                            token: { path: "color.text.inverse", cssVariable: "--x" }
                        },
                        // A background matched to a text colour: no fit, as Generate's prompt treats it.
                        {
                            role: "background",
                            hex: "#262626",
                            token: { path: "color.text.primary", cssVariable: "--y" }
                        },
                        { role: "background", hex: "#123456", token: null }
                    ]
                } as unknown as PlannedComponent["representative"]
            })
        ]);
        expect(fit.colours).toEqual({ fitted: 1, measured: 3 });
        expect(fit.misses.map(miss => miss.value)).toEqual([
            "background #262626",
            "background #123456"
        ]);
    });

    it("counts type sizes and spacing by whether a token was found", () => {
        const fit = themeFit(
            [
                component({
                    typeScale: [
                        {
                            fontSize: 16,
                            token: { path: "type.body", cssVariable: "--b", fontSize: 16 }
                        },
                        { fontSize: 64, token: null }
                    ] as unknown as PlannedComponent["typeScale"]
                })
            ],
            new Map([
                [
                    "Footer",
                    [
                        { kind: "gap", px: 10, elements: 2, token: null },
                        {
                            kind: "section",
                            px: 40,
                            elements: 1,
                            token: { path: "space.section", cssVariable: "--s", px: 40 }
                        }
                    ]
                ]
            ])
        );
        expect(fit.typeSizes).toEqual({ fitted: 1, measured: 2 });
        expect(fit.spacing).toEqual({ fitted: 1, measured: 2 });
    });

    it("says nothing was measured rather than reporting a perfect fit", () => {
        const fit = themeFit([]);
        expect(fit.colours).toEqual({ fitted: 0, measured: 0 });
    });
});
