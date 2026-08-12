/**
 * Fetching robots.txt — see the design brief, section 10.6.
 *
 * Deliberately not done through the browser. Launching Chromium to read a text file costs seconds and
 * a lot of memory, and this has to happen before we decide whether to launch at all.
 *
 * Every failure mode ends in "no rules", which is the standard's own position: absence of a
 * robots.txt is not a prohibition. The alternative — treating a 500 or a timeout as "disallow" — would
 * make extraction fail on sites that never had rules in the first place.
 */

import { createRobotsPolicy, type RobotsPolicy } from "~/browser/robots.js";
import {
    DEFAULT_TIMEOUTS,
    WEBINY_USER_AGENT,
    WEBINY_USER_AGENT_TOKEN,
    withTimeoutOrDefault
} from "@webiny/site-capture";

/**
 * Cap on the bytes we will read.
 *
 * A robots.txt is a few kilobytes. Anything vastly larger is either a misconfigured server returning
 * a page, or something we should not be loading into a Lambda's memory to run regexes over.
 */
export const MAX_ROBOTS_BYTES = 512 * 1024;

export type FetchLike = (
    url: string,
    init?: { headers?: Record<string, string>; signal?: AbortSignal; redirect?: RequestRedirect }
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface FetchRobotsParams {
    /** Any URL on the target site; the origin is what matters. */
    url: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
    userAgentToken?: string;
}

export const robotsUrlFor = (url: string): string | undefined => {
    try {
        return new URL("/robots.txt", new URL(url).origin).toString();
    } catch {
        return undefined;
    }
};

/**
 * Reads the site's crawl rules, returning a permissive policy when there are none to read.
 */
export const fetchRobotsPolicy = async ({
    url,
    fetchImpl = globalThis.fetch as unknown as FetchLike,
    timeoutMs = DEFAULT_TIMEOUTS.robotsMs,
    userAgentToken = WEBINY_USER_AGENT_TOKEN
}: FetchRobotsParams): Promise<RobotsPolicy> => {
    const robotsUrl = robotsUrlFor(url);
    if (!robotsUrl) {
        return createRobotsPolicy(undefined, userAgentToken);
    }

    const text = await withTimeoutOrDefault<string | undefined>(
        `fetch ${robotsUrl}`,
        timeoutMs,
        undefined,
        async () => {
            const response = await fetchImpl(robotsUrl, {
                headers: { "user-agent": WEBINY_USER_AGENT },
                // A redirect chain to a login page is a common way for robots.txt to "exist" without
                // being rules, so we follow but still validate the status.
                redirect: "follow"
            });

            if (!response.ok) {
                return undefined;
            }

            const body = await response.text();
            // Truncation is safe: robots.txt is line-oriented, so a cut-off tail costs us at most the
            // last rule rather than corrupting the ones already parsed.
            return body.length > MAX_ROBOTS_BYTES ? body.slice(0, MAX_ROBOTS_BYTES) : body;
        }
    );

    return createRobotsPolicy(text, userAgentToken);
};
