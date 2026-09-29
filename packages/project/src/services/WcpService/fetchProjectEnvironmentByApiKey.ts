import { getWcpApiUrl } from "@webiny/wcp";
import { type IWcpEnvironmentDto } from "~/abstractions/models/index.js";

// Long enough for a cold start behind a cache miss (about 2s), short enough that a stuck request
// still leaves time to fall back to the GraphQL query.
const TIMEOUT_MS = 10_000;

interface FetchProjectEnvironmentByApiKeyParams {
    apiKey: string;
    orgId: string;
    projectId: string;
}

/*
 * Looks up a project environment through WCP's REST endpoint rather than its GraphQL API.
 *
 * The CLI does this on every command, and a GraphQL POST can never be cached, so it was a full round
 * trip to WCP every time: about 500ms. This endpoint is a GET that CloudFront caches per API key,
 * so a repeat lookup comes back from the edge in tens of milliseconds. It returns the same fields as
 * the GraphQL query.
 *
 * Throws on anything other than a successful response, including a disabled environment, a key
 * from another project, or a WCP without this route. Callers fall back to the GraphQL query, which
 * reports those cases the way it always has.
 */
export const fetchProjectEnvironmentByApiKey = async (
    params: FetchProjectEnvironmentByApiKeyParams
): Promise<IWcpEnvironmentDto> => {
    const { apiKey, orgId, projectId } = params;

    const orgPath = encodeURIComponent(orgId);
    const projectPath = encodeURIComponent(projectId);
    const url = getWcpApiUrl(`/orgs/${orgPath}/projects/${projectPath}/environment`);

    const response = await fetch(url, {
        headers: { authorization: apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!response.ok) {
        throw new Error(`WCP returned ${response.status} for the project environment.`);
    }

    const body: { environment?: IWcpEnvironmentDto } = await response.json();
    if (!body.environment) {
        throw new Error("WCP returned no project environment.");
    }

    return body.environment;
};
