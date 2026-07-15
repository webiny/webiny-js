/**
 * Resolve the base URL the file-upload endpoints (`/webiny-file-upload`) are reachable at. This URL is
 * handed to the client (admin) in the upload payload, so it must be an origin the client can POST to.
 *
 * The DI-native server gql context exposes no request headers to resolvers (GraphQLRoute forwards only
 * the body), so — unlike the AWS flavour — we cannot derive the host from the incoming request. Instead
 * we use the configured API origin `WEBINY_API_URL` (the same value the admin app is pointed at via
 * `Admin.ApiUrl`), falling back to `http://localhost:${PORT}` for local dev where the client and server
 * share the machine (PORT is injected at runtime by runApiServer — the port the server listens on).
 */
export const resolveServerUrl = (): string => {
    const configured = process.env.WEBINY_API_URL;
    if (configured) {
        return configured.replace(/\/+$/, "");
    }

    const port = process.env.PORT || "3002";
    return `http://localhost:${port}`;
};
