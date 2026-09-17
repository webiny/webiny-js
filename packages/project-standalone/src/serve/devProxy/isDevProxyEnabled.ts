/**
 * Whether a proxy was reserved for this process.
 *
 * `reserveDevProxyPorts` writes the port it took, so the presence of that env var is the decision.
 * Reading it back is how the project layer, which assembles the server processes, learns what the
 * CLI decided without either side having to pass it through the hosting-agnostic Watch/Serve params.
 */
export function isDevProxyEnabled(): boolean {
    return Boolean(process.env.WEBINY_PROXY_PORT);
}
