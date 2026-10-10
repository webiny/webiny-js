import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { readFileSync } from "node:fs";
import type { ThemeManifest } from "@webiny/theme-common";
import { withRematchedColours } from "~/features/stages/generate/componentGeneration.js";
import { themeFit } from "./themeFit.js";

const clusterFixture = (name: string) =>
    JSON.parse(
        readFileSync(
            new URL(`../stages/cluster/__fixtures__/${name}.json`, import.meta.url),
            "utf8"
        )
    );

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
                            token: {
                                path: "color.text.inverse",
                                cssVariable: "--x",
                                hex: "#ffffff"
                            }
                        },
                        // A background matched to a text colour: no fit, as Generate's prompt treats it.
                        {
                            role: "background",
                            hex: "#262626",
                            token: {
                                path: "color.text.primary",
                                cssVariable: "--y",
                                hex: "#262626"
                            }
                        },
                        { role: "background", hex: "#123456", token: null }
                    ]
                } as unknown as PlannedComponent["representative"]
            })
        ]);
        expect(fit.colours).toEqual({ fitted: 1, measured: 3, near: 0 });
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
        expect(fit.colours).toEqual({ fitted: 0, measured: 0, near: 0 });
    });

    it("counts a token as a fit only when it is the measured colour, and counts near ones apart", () => {
        const fit = themeFit([
            component({
                representative: {
                    resolvedColours: [
                        {
                            role: "background",
                            hex: "#f2f2f2",
                            area: 1,
                            token: {
                                path: "color.surface.raised",
                                cssVariable: "--r",
                                hex: "#f7f7f9"
                            }
                        }
                    ]
                } as unknown as PlannedComponent["representative"]
            })
        ]);
        expect(fit.colours).toEqual({ fitted: 0, measured: 1, near: 1 });
        expect(fit.misses.map(miss => miss.value)).toEqual([
            "background #f2f2f2 (near color.surface.raised, 10 away)"
        ]);
    });

    /*
     * ParkCity - Take 3, the run that read 57 of 57 with five sections the wrong colour. Its 57 stored
     * colours and its pinned theme are both real.
     */
    describe("on ParkCity - Take 3", () => {
        const stored = clusterFixture("take3StoredColours") as {
            signature: string;
            colours: PlannedComponent["representative"]["resolvedColours"];
        }[];
        const theme = clusterFixture("pinnedThemeColours").take3 as ThemeManifest;
        const components = stored.map(cluster =>
            component({
                name: cluster.signature,
                representative: {
                    resolvedColours: cluster.colours
                } as PlannedComponent["representative"]
            })
        );

        it("no longer counts the five status bindings Cluster recorded", () => {
            expect(themeFit(components).colours).toEqual({ fitted: 52, measured: 57, near: 0 });
        });

        it("matched against the pinned theme, reads 56 matched and the footer near", () => {
            const fit = themeFit(components.map(planned => withRematchedColours(planned, theme)));
            expect(fit.colours).toEqual({ fitted: 56, measured: 57, near: 1 });
        });
    });
});
