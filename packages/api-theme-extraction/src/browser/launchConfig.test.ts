import { describe, expect, it } from "vitest";
import {
    ChromiumNotFoundError,
    DEFAULT_TIMEOUTS,
    ENV_EXECUTABLE_PATH,
    ENV_PACK_PATH,
    ENV_USER_AGENT,
    isResolved,
    LAYER_EXECUTABLE_CANDIDATES,
    mergeLaunchArgs,
    resolveExecutablePath,
    resolvePackPath,
    resolveUserAgent,
    WEBINY_USER_AGENT,
    WEBINY_USER_AGENT_TOKEN
} from "./launchConfig.js";

const never = () => false;
const always = () => true;

describe("resolveExecutablePath", () => {
    it("takes an explicit config path without checking the filesystem", () => {
        // A named path that does not exist should fail loudly naming that path, not silently fall
        // through to a different binary than the one asked for.
        const result = resolveExecutablePath({
            config: { executablePath: "/custom/chrome" },
            env: {},
            exists: never
        });

        expect(result).toEqual({
            path: "/custom/chrome",
            source: "config",
            tried: ["/custom/chrome"]
        });
    });

    it("takes the environment override next", () => {
        const result = resolveExecutablePath({
            env: { [ENV_EXECUTABLE_PATH]: "/env/chrome" },
            exists: never
        });

        expect(result).toMatchObject({ path: "/env/chrome", source: "environment" });
    });

    it("prefers config over the environment", () => {
        const result = resolveExecutablePath({
            config: { executablePath: "/config/chrome" },
            env: { [ENV_EXECUTABLE_PATH]: "/env/chrome" },
            exists: always
        });

        expect(result).toMatchObject({ path: "/config/chrome" });
    });

    it("discovers the first candidate that exists in the layer", () => {
        const result = resolveExecutablePath({
            env: {},
            exists: path => path === "/opt/bin/chromium",
            candidates: LAYER_EXECUTABLE_CANDIDATES
        });

        expect(result).toMatchObject({ path: "/opt/bin/chromium", source: "layer" });
    });

    it("reports every location tried when nothing is found", () => {
        // The layer's internal layout is unverified, so this list is what makes the first deploy
        // diagnostic rather than a guessing game.
        const result = resolveExecutablePath({ env: {}, exists: never });

        expect(isResolved(result)).toBe(false);
        expect(result.tried).toEqual([...LAYER_EXECUTABLE_CANDIDATES]);
    });

    it("stops at the first hit rather than probing the rest", () => {
        const probed: string[] = [];
        resolveExecutablePath({
            env: {},
            exists: path => {
                probed.push(path);
                return true;
            }
        });

        expect(probed).toEqual([LAYER_EXECUTABLE_CANDIDATES[0]]);
    });
});

describe("ChromiumNotFoundError", () => {
    it("lists what was tried and names the layer and the override", () => {
        const error = new ChromiumNotFoundError(["/opt/chromium", "/opt/bin/chromium"]);

        expect(error.message).toContain("/opt/chromium");
        expect(error.message).toContain("/opt/bin/chromium");
        expect(error.message).toContain("chromium' Lambda layer");
        expect(error.message).toContain(ENV_EXECUTABLE_PATH);
    });
});

describe("mergeLaunchArgs", () => {
    const defaults = ["--no-sandbox", "--single-process"];

    it("uses the driver's defaults when nothing is configured", () => {
        expect(mergeLaunchArgs(defaults)).toEqual(defaults);
    });

    it("appends extra arguments", () => {
        expect(mergeLaunchArgs(defaults, { extraArgs: ["--lang=en-GB"] })).toEqual([
            "--no-sandbox",
            "--single-process",
            "--lang=en-GB"
        ]);
    });

    it("replaces the defaults wholesale when args are given", () => {
        expect(mergeLaunchArgs(defaults, { args: ["--headless"] })).toEqual(["--headless"]);
    });

    it("still appends extras to replaced args", () => {
        expect(
            mergeLaunchArgs(defaults, { args: ["--headless"], extraArgs: ["--mute-audio"] })
        ).toEqual(["--headless", "--mute-audio"]);
    });

    it("de-duplicates, because Chromium takes the first of a repeated switch", () => {
        // An accidental duplicate would otherwise silently win over the intended value.
        expect(mergeLaunchArgs(defaults, { extraArgs: ["--no-sandbox"] })).toEqual(defaults);
    });
});

describe("resolveUserAgent", () => {
    it("identifies itself as Webiny by default", () => {
        const agent = resolveUserAgent(undefined, {});

        expect(agent).toBe(WEBINY_USER_AGENT);
        expect(agent).toContain(WEBINY_USER_AGENT_TOKEN);
        expect(agent).toContain("webiny.com");
    });

    it("can be overridden by config, then by environment", () => {
        expect(resolveUserAgent({ userAgent: "Custom/1.0" }, {})).toBe("Custom/1.0");
        expect(resolveUserAgent(undefined, { [ENV_USER_AGENT]: "Env/1.0" })).toBe("Env/1.0");
        expect(resolveUserAgent({ userAgent: "Custom/1.0" }, { [ENV_USER_AGENT]: "Env/1.0" })).toBe(
            "Custom/1.0"
        );
    });
});

describe("resolvePackPath", () => {
    it("is undefined unless configured", () => {
        expect(resolvePackPath(undefined, {})).toBeUndefined();
        expect(resolvePackPath({ packPath: "/opt/chromium.br" }, {})).toBe("/opt/chromium.br");
        expect(resolvePackPath(undefined, { [ENV_PACK_PATH]: "/opt/pack" })).toBe("/opt/pack");
    });
});

describe("DEFAULT_TIMEOUTS", () => {
    it("caps banner dismissal at the brief's two seconds", () => {
        expect(DEFAULT_TIMEOUTS.bannerMs).toBe(2000);
    });

    it("gives every operation a positive ceiling", () => {
        for (const [name, value] of Object.entries(DEFAULT_TIMEOUTS)) {
            expect(value, name).toBeGreaterThan(0);
        }
    });

    it("keeps a whole page inside a fraction of the task's fifteen minutes", () => {
        // Five pages plus a dark-mode probe must leave room for the model call and draft creation.
        expect(DEFAULT_TIMEOUTS.pageTotalMs * 6).toBeLessThan(900_000 / 2);
    });

    it("does not let one step outlast the page that contains it", () => {
        expect(DEFAULT_TIMEOUTS.navigationMs).toBeLessThanOrEqual(DEFAULT_TIMEOUTS.pageTotalMs);
        expect(DEFAULT_TIMEOUTS.evaluateMs).toBeLessThanOrEqual(DEFAULT_TIMEOUTS.pageTotalMs);
        expect(DEFAULT_TIMEOUTS.screenshotMs).toBeLessThanOrEqual(DEFAULT_TIMEOUTS.pageTotalMs);
    });
});
