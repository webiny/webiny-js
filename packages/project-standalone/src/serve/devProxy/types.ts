/** Where the proxy will answer, for whoever needs to print it or point an app at it. */
export interface IDevProxyUrls {
    /** The proxy's origin, e.g. `http://localhost:3001`. */
    url: string;
    /** Where the api answers through it, e.g. `http://localhost:3001/api`. */
    apiUrl: string;
}

export interface IReserveDevProxyPortsParams {
    /** Apps in this session. One app already has one URL, so a proxy only earns its keep from two. */
    apps: string[];
    /** Explicit opt-out, e.g. the CLI's `--no-proxy`. */
    enabled?: boolean;
}
