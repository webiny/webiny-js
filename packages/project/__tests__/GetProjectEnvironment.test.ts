import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";

const gqlExecute = vi.fn();

vi.mock("~/services/WcpService/WcpGqlClient.js", () => {
    return { WcpGqlClient: { execute: (...args: unknown[]) => gqlExecute(...args) } };
});

const { GetProjectEnvironment } = await import("~/services/WcpService/GetProjectEnvironment.js");

const environmentDto = {
    id: "env-id",
    status: "enabled",
    name: "dev",
    apiKey: "the-api-key",
    org: { id: "my-org", name: "My Org" },
    project: { id: "my-project", name: "My Project" },
    user: null
};

const createGetProjectEnvironment = () => {
    return new GetProjectEnvironment({
        localStorageService: { get: () => undefined } as any
    });
};

const jsonResponse = (status: number, body: unknown) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" }
    });
};

describe("GetProjectEnvironment with an API key", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        gqlExecute.mockReset();
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses the REST endpoint and never touches GraphQL when it answers", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { environment: environmentDto }));

        const environment = await createGetProjectEnvironment().execute({
            apiKey: "the-api-key",
            orgId: "my-org",
            projectId: "my-project"
        });

        expect(environment.id).toBe("env-id");
        expect(gqlExecute).not.toHaveBeenCalled();

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("https://api.webiny.com/orgs/my-org/projects/my-project/environment");
        expect(init.headers).toEqual({ authorization: "the-api-key" });
    });

    // A disabled environment, a key from another project, or a WCP without the route all come
    // back as errors. GraphQL then reports them exactly as it did before the endpoint existed.
    it("falls back to GraphQL when the REST endpoint returns an error", async () => {
        fetchMock.mockResolvedValue(jsonResponse(500, { message: "environment inactive" }));
        gqlExecute.mockResolvedValue({ projects: { getEnvironment: environmentDto } });

        const environment = await createGetProjectEnvironment().execute({
            apiKey: "the-api-key",
            orgId: "my-org",
            projectId: "my-project"
        });

        expect(environment.id).toBe("env-id");
        expect(gqlExecute).toHaveBeenCalledTimes(1);
        expect(gqlExecute.mock.calls[0][1]).toEqual({ apiKey: "the-api-key" });
    });

    it("falls back to GraphQL when the request itself fails", async () => {
        fetchMock.mockRejectedValue(new TypeError("fetch failed"));
        gqlExecute.mockResolvedValue({ projects: { getEnvironment: environmentDto } });

        const environment = await createGetProjectEnvironment().execute({
            apiKey: "the-api-key",
            orgId: "my-org",
            projectId: "my-project"
        });

        expect(environment.id).toBe("env-id");
        expect(gqlExecute).toHaveBeenCalledTimes(1);
    });

    it("falls back to GraphQL when the response has no environment", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, {}));
        gqlExecute.mockResolvedValue({ projects: { getEnvironment: environmentDto } });

        await createGetProjectEnvironment().execute({
            apiKey: "the-api-key",
            orgId: "my-org",
            projectId: "my-project"
        });

        expect(gqlExecute).toHaveBeenCalledTimes(1);
    });

    // The endpoint's URL needs both IDs, so a caller with just a key keeps using GraphQL.
    it("goes straight to GraphQL without the org and project", async () => {
        gqlExecute.mockResolvedValue({ projects: { getEnvironment: environmentDto } });

        await createGetProjectEnvironment().execute({ apiKey: "the-api-key" });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(gqlExecute).toHaveBeenCalledTimes(1);
    });

    it("still reports a bad key the old way when both fail", async () => {
        fetchMock.mockResolvedValue(jsonResponse(500, {}));
        gqlExecute.mockRejectedValue(new Error("not found"));

        await expect(
            createGetProjectEnvironment().execute({
                apiKey: "bad-key",
                orgId: "my-org",
                projectId: "my-project"
            })
        ).rejects.toThrow("It seems the API key you provided is incorrect or disabled.");
    });

    it("escapes the org and project in the URL", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { environment: environmentDto }));

        await createGetProjectEnvironment().execute({
            apiKey: "the-api-key",
            orgId: "my org",
            projectId: "a/b"
        });

        expect(fetchMock.mock.calls[0][0]).toBe(
            "https://api.webiny.com/orgs/my%20org/projects/a%2Fb/environment"
        );
    });
});
