import { describe, expect, it } from "vitest";
import { BotChallengeError, detectBotChallenge, type ChallengeInput } from "./botChallenge.js";

const input = (overrides: Partial<ChallengeInput> = {}): ChallengeInput => ({
    status: 200,
    headers: {},
    title: "Northbeam — Analytics for growing teams",
    bodyText: "A".repeat(5000),
    html: "<html><body><h1>Northbeam</h1></body></html>",
    ...overrides
});

describe("detectBotChallenge", () => {
    it("passes a normal page through", () => {
        expect(detectBotChallenge(input())).toEqual({ challenged: false });
    });

    it("trusts the cf-mitigated header on its own", () => {
        const result = detectBotChallenge(input({ headers: { "cf-mitigated": "challenge" } }));

        expect(result).toMatchObject({ challenged: true, vendor: "cloudflare" });
    });

    it("detects a Cloudflare challenge page", () => {
        const result = detectBotChallenge(
            input({
                status: 403,
                html: '<div id="cf-browser-verification"></div>',
                title: "Just a moment..."
            })
        );

        expect(result).toMatchObject({ challenged: true, vendor: "cloudflare" });
    });

    it("does not flag a 200 page merely titled like an interstitial", () => {
        // Some real pages are called this. Without a marker or a refusal, it is not a challenge.
        const result = detectBotChallenge(input({ title: "Just a moment..." }));
        expect(result.challenged).toBe(false);
    });

    it("names the other vendors it knows", () => {
        const cases: Array<[string, Partial<ChallengeInput>]> = [
            ["datadome", { html: '<script src="https://captcha-delivery.com/x.js"></script>' }],
            ["perimeterx", { html: '<div id="px-captcha"></div>' }],
            ["imperva", { html: "<div>_Incapsula_Resource</div>" }],
            ["akamai", { html: '<img src="https://errors.edgesuite.net/x">' }]
        ];

        for (const [vendor, overrides] of cases) {
            expect(detectBotChallenge(input(overrides))).toMatchObject({
                challenged: true,
                vendor
            });
        }
    });

    it("requires both markers for an Akamai access-denied page", () => {
        const denied = detectBotChallenge(
            input({ status: 403, bodyText: "Access Denied. Reference #18.2a.1" })
        );
        expect(denied).toMatchObject({ vendor: "akamai" });

        // "Access denied" alone is far too common to act on.
        const ambiguous = detectBotChallenge(input({ status: 200, bodyText: "Access denied" }));
        expect(ambiguous.challenged).toBe(false);
    });

    it("ignores a reCAPTCHA widget on a working page", () => {
        // A contact or login form legitimately carries one.
        const result = detectBotChallenge(
            input({ html: '<form><div class="g-recaptcha"></div></form>' })
        );

        expect(result.challenged).toBe(false);
    });

    it("flags reCAPTCHA when the request was refused", () => {
        const result = detectBotChallenge(
            input({ status: 429, html: '<div class="g-recaptcha"></div>' })
        );

        expect(result).toMatchObject({ challenged: true, vendor: "recaptcha" });
    });

    it("flags reCAPTCHA with an automated-traffic notice", () => {
        const result = detectBotChallenge(
            input({
                html: '<div class="g-recaptcha"></div>',
                bodyText: "Our systems have detected unusual traffic from your network."
            })
        );

        expect(result).toMatchObject({ challenged: true, vendor: "recaptcha" });
    });

    it("treats a rate limit as a challenge with its own remedy", () => {
        const result = detectBotChallenge(input({ status: 429 }));

        expect(result).toMatchObject({ challenged: true, vendor: "unknown" });
        expect(result.challenged && result.remedy).toContain("Wait a few minutes");
    });

    it("treats a short-bodied refusal as a block page", () => {
        const result = detectBotChallenge(input({ status: 403, bodyText: "Forbidden" }));
        expect(result).toMatchObject({ challenged: true, vendor: "unknown" });
    });

    it("leaves a content-bearing 403 alone", () => {
        // A real "you need an account" page has content we could still learn a theme from.
        const result = detectBotChallenge(input({ status: 403, bodyText: "A".repeat(4000) }));
        expect(result.challenged).toBe(false);
    });

    it("matches markers regardless of case", () => {
        const result = detectBotChallenge(input({ html: "<div>DataDome</div>" }));
        expect(result).toMatchObject({ challenged: true, vendor: "datadome" });
    });
});

describe("BotChallengeError", () => {
    it("says who blocked us, what we matched, and what to do", () => {
        const challenge = detectBotChallenge(input({ headers: { "cf-mitigated": "challenge" } }));
        if (!challenge.challenged) {
            throw new Error("expected a challenge");
        }

        const error = new BotChallengeError("https://northbeam.io/", challenge);

        expect(error.message).toContain("Cloudflare");
        expect(error.message).toContain("https://northbeam.io/");
        expect(error.message).toContain("cf-mitigated");
        expect(error.message).toContain("allow Webiny's crawler");
        expect(error.vendor).toBe("cloudflare");
    });
});
