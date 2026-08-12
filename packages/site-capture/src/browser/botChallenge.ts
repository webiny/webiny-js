/**
 * Detecting a bot challenge — see the design brief, section 10.6.
 *
 * Left undetected, a challenge page is the worst possible failure: it loads, it has a background
 * colour and a font, and it produces a plausible-looking theme built entirely from Cloudflare's
 * interstitial. Silently generating a wrong theme is far worse than refusing, so this runs before any
 * sampling and the error names the vendor — a user who knows Cloudflare stopped us can allow-list
 * Webiny, whereas "extraction failed" tells them nothing they can act on.
 *
 * Detection is deliberately conservative. False positives block legitimate extractions, so a bare
 * keyword is never enough: markers must be vendor-specific, or corroborated by a status code.
 */

export type BotChallenge =
    | { challenged: false }
    | {
          challenged: true;
          /** Vendor id when known, `"unknown"` when only the status told us. */
          vendor: string;
          /** Human-readable vendor name for the error message. */
          vendorName: string;
          /** What we matched on, so a support conversation can start from a fact. */
          signal: string;
          /** What the user can actually do about it. */
          remedy: string;
      };

export interface ChallengeInput {
    status: number;
    /** Lower-cased header names. */
    headers: Record<string, string>;
    title: string;
    /** The page's rendered text, used only for corroboration. */
    bodyText: string;
    html: string;
}

const ALLOW_LIST_REMEDY =
    "If you own this site, allow Webiny's crawler through your CDN or firewall, then try again. " +
    "You can also set a different user agent for extraction.";

const RATE_LIMIT_REMEDY = "The site is rate limiting us. Wait a few minutes and try again.";

interface Detector {
    vendor: string;
    vendorName: string;
    remedy: string;
    detect(input: ChallengeInput, html: string, text: string): string | undefined;
}

const DETECTORS: Detector[] = [
    {
        vendor: "cloudflare",
        vendorName: "Cloudflare",
        remedy: ALLOW_LIST_REMEDY,
        detect(input, html) {
            // `cf-mitigated` is set precisely when Cloudflare has acted on the request, so it needs
            // no corroboration.
            if (input.headers["cf-mitigated"]) {
                return "cf-mitigated response header";
            }
            for (const marker of [
                "cf-browser-verification",
                "/cdn-cgi/challenge-platform",
                "__cf_chl",
                "cf-challenge"
            ]) {
                if (html.includes(marker)) {
                    return `Cloudflare challenge marker "${marker}"`;
                }
            }
            // A well-known interstitial title, but only when the page is not a normal 200 document
            // that happens to be called this.
            if (input.title.trim().toLowerCase() === "just a moment..." && input.status !== 200) {
                return `interstitial title "${input.title.trim()}"`;
            }
            return undefined;
        }
    },
    {
        vendor: "datadome",
        vendorName: "DataDome",
        remedy: ALLOW_LIST_REMEDY,
        detect(_input, html) {
            for (const marker of ["captcha-delivery.com", "datadome"]) {
                if (html.includes(marker)) {
                    return `DataDome marker "${marker}"`;
                }
            }
            return undefined;
        }
    },
    {
        vendor: "perimeterx",
        vendorName: "HUMAN (PerimeterX)",
        remedy: ALLOW_LIST_REMEDY,
        detect(_input, html) {
            for (const marker of ["px-captcha", "_pxhd", "perimeterx"]) {
                if (html.includes(marker)) {
                    return `PerimeterX marker "${marker}"`;
                }
            }
            return undefined;
        }
    },
    {
        vendor: "imperva",
        vendorName: "Imperva (Incapsula)",
        remedy: ALLOW_LIST_REMEDY,
        detect(_input, html) {
            for (const marker of ["_incapsula_resource", "incident_id"]) {
                if (html.includes(marker)) {
                    return `Imperva marker "${marker}"`;
                }
            }
            return undefined;
        }
    },
    {
        vendor: "akamai",
        vendorName: "Akamai",
        remedy: ALLOW_LIST_REMEDY,
        detect(input, html, text) {
            if (html.includes("errors.edgesuite.net")) {
                return "Akamai error page reference";
            }
            // Akamai's block page is "Access Denied" plus a reference number. Both are needed —
            // either alone is far too common.
            if (
                input.status === 403 &&
                text.includes("access denied") &&
                text.includes("reference #")
            ) {
                return "Akamai access-denied page with a reference number";
            }
            return undefined;
        }
    },
    {
        vendor: "recaptcha",
        vendorName: "reCAPTCHA",
        remedy: ALLOW_LIST_REMEDY,
        detect(input, html, text) {
            // A reCAPTCHA widget is normal on a contact or login page, so it only counts as a wall
            // when the response was refused or the page says why.
            const hasWidget = html.includes("g-recaptcha") || html.includes("recaptcha/api.js");
            if (!hasWidget) {
                return undefined;
            }
            if (input.status === 403 || input.status === 429) {
                return `reCAPTCHA on an HTTP ${input.status} response`;
            }
            if (text.includes("unusual traffic") || text.includes("automated queries")) {
                return "reCAPTCHA with an automated-traffic notice";
            }
            return undefined;
        }
    }
];

/** Bodies shorter than this on a refusal are block pages, not content. */
const BLOCK_PAGE_MAX_LENGTH = 2000;

export const detectBotChallenge = (input: ChallengeInput): BotChallenge => {
    const html = input.html.toLowerCase();
    const text = input.bodyText.toLowerCase();

    for (const detector of DETECTORS) {
        const signal = detector.detect(input, html, text);
        if (signal) {
            return {
                challenged: true,
                vendor: detector.vendor,
                vendorName: detector.vendorName,
                signal,
                remedy: detector.remedy
            };
        }
    }

    if (input.status === 429) {
        return {
            challenged: true,
            vendor: "unknown",
            vendorName: "the site",
            signal: "HTTP 429 Too Many Requests",
            remedy: RATE_LIMIT_REMEDY
        };
    }

    // A refusal with almost no body is a block page. A refusal with a full page of content is more
    // likely a real 403 document we could still learn from, so it is left alone.
    if (
        (input.status === 403 || input.status === 401) &&
        input.bodyText.trim().length < BLOCK_PAGE_MAX_LENGTH
    ) {
        return {
            challenged: true,
            vendor: "unknown",
            vendorName: "the site",
            signal: `HTTP ${input.status} with a ${input.bodyText.trim().length}-character body`,
            remedy: ALLOW_LIST_REMEDY
        };
    }

    return { challenged: false };
};

export class BotChallengeError extends Error {
    readonly vendor: string;
    readonly signal: string;
    readonly remedy: string;

    constructor(url: string, challenge: Extract<BotChallenge, { challenged: true }>) {
        super(
            `${challenge.vendorName} blocked automated access to ${url} ` +
                `(detected via ${challenge.signal}). ${challenge.remedy}`
        );
        this.name = "BotChallengeError";
        this.vendor = challenge.vendor;
        this.signal = challenge.signal;
        this.remedy = challenge.remedy;
    }
}
