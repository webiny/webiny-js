/**
 * Where Chromium is and how it starts — see the design brief, sections 10.2 and 10.6.
 *
 * The binary comes from the `chromium` Lambda layer (`scripts/layers/chromium.js`, Chromium 123.0.1),
 * which is attached to the background-task function. The layer's internal layout is not verified in
 * this repo, so the path is resolved from a candidate list rather than hardcoded, every step is
 * overridable by config or environment, and a failure reports every location tried. The alternative —
 * guessing one path — turns a wrong guess into a deploy-debug cycle instead of one legible error.
 */

/**
 * Honest by default.
 *
 * A Chrome-lookalike user agent would get through more CDNs, and that is exactly why we do not use
 * one: this fetches a third party's site from Webiny's infrastructure, and it should be identifiable
 * and blockable. When a WAF does stop us, `BotChallengeError` says so and the agent is overridable —
 * so the customer extracting their own site can let themselves through deliberately.
 */
export const WEBINY_USER_AGENT_TOKEN = "WebinyThemeExtractor";

export const WEBINY_USER_AGENT = `Mozilla/5.0 (compatible; ${WEBINY_USER_AGENT_TOKEN}/1.0; +https://www.webiny.com)`;

/**
 * Candidate ready-to-run executable locations inside the layer, in order.
 *
 * Webiny's own "chromium" layer ships a @sparticuz pack rather than an inflated binary (see
 * LAYER_PACK_CANDIDATES below), so in practice none of these match and discovery falls through to the
 * pack path. They stay as a cheap fallback for a layer that does lay a ready binary at one of these
 * spots, which the sparticuz-family layouts have historically done.
 */
export const LAYER_EXECUTABLE_CANDIDATES = [
    "/opt/chromium",
    "/opt/bin/chromium",
    "/opt/chrome/chrome",
    "/opt/bin/chrome",
    "/opt/chrome-linux/chrome"
] as const;

/**
 * Where the compressed Chromium pack lives, for `chromium-min` to inflate into /tmp.
 *
 * The Webiny "chromium" layer is a @sparticuz/chromium layer: it installs that package under
 * `/opt/nodejs/node_modules`, and its `bin/` holds the brotli packs (chromium.br plus the
 * al2/al2023/fonts/swiftshader archives). `chromium-min.executablePath(dir)` expects that `bin`
 * directory and inflates the `.br` files from it. Confirmed against the deployed layer's contents.
 */
export const LAYER_PACK_CANDIDATES = ["/opt/nodejs/node_modules/@sparticuz/chromium/bin"] as const;

export const ENV_EXECUTABLE_PATH = "WEBINY_CHROMIUM_EXECUTABLE_PATH";
export const ENV_PACK_PATH = "WEBINY_CHROMIUM_PACK_PATH";
export const ENV_USER_AGENT = "WEBINY_THEME_EXTRACTION_USER_AGENT";

export interface ChromiumConfig {
    /** Skips discovery entirely. */
    executablePath?: string;
    /** Passed to `chromium-min` when no ready executable is found. */
    packPath?: string;
    /** Replaces the driver's default arguments. */
    args?: string[];
    /** Appended to whatever arguments are in effect. */
    extraArgs?: string[];
    userAgent?: string;
}

export class ChromiumNotFoundError extends Error {
    constructor(tried: string[]) {
        super(
            "Could not locate the Chromium executable. Tried, in order: " +
                `${tried.join(", ")}. The 'chromium' Lambda layer supplies this binary — confirm it is ` +
                `attached to the background-task function, or set ${ENV_EXECUTABLE_PATH} to its path.`
        );
        this.name = "ChromiumNotFoundError";
    }
}

export interface ResolveExecutableParams {
    config?: ChromiumConfig;
    env?: Record<string, string | undefined>;
    /** Injected so resolution is testable without a filesystem. */
    exists(path: string): boolean;
    candidates?: readonly string[];
}

export interface ExecutableResolution {
    path: string;
    /** Which branch supplied it — logged, so the first deploy tells us the layer's real layout. */
    source: "config" | "environment" | "layer";
    tried: string[];
}

/**
 * Finds a ready-to-run executable, or reports that none of the candidates existed.
 *
 * Explicit config and environment values are trusted without an existence check: if someone has
 * named a path, a "not found" from the driver naming that path is more useful than us silently
 * falling through to a different binary than the one they asked for.
 */
export const resolveExecutablePath = ({
    config,
    env = process.env,
    exists,
    candidates = LAYER_EXECUTABLE_CANDIDATES
}: ResolveExecutableParams): ExecutableResolution | { tried: string[] } => {
    if (config?.executablePath) {
        return { path: config.executablePath, source: "config", tried: [config.executablePath] };
    }

    const fromEnv = env[ENV_EXECUTABLE_PATH];
    if (fromEnv) {
        return { path: fromEnv, source: "environment", tried: [fromEnv] };
    }

    const tried: string[] = [];
    for (const candidate of candidates) {
        tried.push(candidate);
        if (exists(candidate)) {
            return { path: candidate, source: "layer", tried };
        }
    }

    return { tried };
};

export const isResolved = (
    resolution: ExecutableResolution | { tried: string[] }
): resolution is ExecutableResolution => {
    return "path" in resolution;
};

/**
 * Arguments the driver should launch with.
 *
 * `defaults` comes from `chromium-min`, which knows the flags a Lambda's sandbox and /tmp-only
 * filesystem require; we do not restate them here, because a stale hand-maintained copy of that list
 * is a failure that only shows up in production. `config.args` replaces them wholesale for the case
 * where a customer runs a different Chromium, and `extraArgs` appends.
 */
export const mergeLaunchArgs = (defaults: string[], config?: ChromiumConfig): string[] => {
    const base = config?.args ?? defaults;
    // De-duplicated because Chromium takes the first occurrence of a repeated switch, which makes an
    // accidental duplicate silently win over the intended value.
    return Array.from(new Set([...base, ...(config?.extraArgs ?? [])]));
};

export const resolveUserAgent = (
    config?: ChromiumConfig,
    env: Record<string, string | undefined> = process.env
): string => {
    return config?.userAgent ?? env[ENV_USER_AGENT] ?? WEBINY_USER_AGENT;
};

export const resolvePackPath = (
    config?: ChromiumConfig,
    env: Record<string, string | undefined> = process.env
): string | undefined => {
    return config?.packPath ?? env[ENV_PACK_PATH];
};

/**
 * Per-operation ceilings. Every one of these is enforced — see `withTimeout`.
 *
 * The page total is not the sum of its parts: navigation can finish quickly and then a heavy page can
 * spend a long time in sampling, so the total is what actually protects the task's budget.
 */
export const DEFAULT_TIMEOUTS = {
    /** Launching the browser, including any pack unpacking on a cold start. */
    launchMs: 45_000,
    navigationMs: 30_000,
    /** Ceiling for one page end to end, whatever it spends its time on. */
    pageTotalMs: 60_000,
    /** The brief's cap on cookie-banner dismissal. */
    bannerMs: 2000,
    evaluateMs: 20_000,
    screenshotMs: 15_000,
    robotsMs: 5000,
    closeMs: 10_000
} as const;
