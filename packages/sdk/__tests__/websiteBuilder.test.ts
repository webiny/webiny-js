import { describe, expect, it, vi } from "vitest";
import { Webiny } from "~/index.js";

interface Call {
    url: string;
    headers: Record<string, string>;
    query: string;
    variables: Record<string, unknown>;
}

const createSdk = (responseData: unknown, init: { status?: number } = {}) => {
    const calls: Call[] = [];
    const fetchFn = vi.fn(async (url: string, options: RequestInit) => {
        const body = JSON.parse(String(options.body));
        calls.push({
            url,
            headers: options.headers as Record<string, string>,
            query: body.query,
            variables: body.variables
        });
        return new Response(JSON.stringify({ data: responseData }), {
            status: init.status ?? 200,
            headers: { "Content-Type": "application/json" }
        });
    });
    const sdk = new Webiny({
        endpoint: "https://api.example.com",
        token: "token-1",
        tenant: "root",
        headers: () => ({ "x-pac-airline": "t5t" }),
        fetch: fetchFn as unknown as typeof fetch
    });
    return { sdk, calls };
};

const squash = (query: string) => query.replace(/\s+/g, " ").trim();

describe("websiteBuilder SDK", () => {
    it("publishes a page and returns the selected fields", async () => {
        const page = { id: "p1#0001", entryId: "p1", status: "published" };
        const { sdk, calls } = createSdk({
            websiteBuilder: { publishPage: { data: page, error: null } }
        });

        const result = await sdk.websiteBuilder.publishPage({
            id: "p1#0001",
            fields: ["id", "entryId", "status"]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(page);
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe("https://api.example.com/graphql");
        expect(calls[0].headers).toMatchObject({
            "x-tenant": "root",
            "x-pac-airline": "t5t",
            Authorization: "Bearer token-1"
        });
        expect(squash(calls[0].query)).toContain(
            "mutation WbPublishPage($id: ID!) { websiteBuilder { publishPage(id: $id) { data { entryId id status } error { message code }"
        );
        expect(calls[0].variables).toEqual({ id: "p1#0001" });
    });

    it("nests dotted fields and returns list meta", async () => {
        const meta = { cursor: null, hasMoreItems: false, totalCount: 1 };
        const { sdk, calls } = createSdk({
            websiteBuilder: {
                listPages: { data: [{ id: "p1#0001" }], meta, error: null }
            }
        });

        const result = await sdk.websiteBuilder.listPages({
            where: { latest: true, location: { folderId: "f1" } },
            limit: 50,
            fields: ["id", "location.folderId", "createdBy.displayName"]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ data: [{ id: "p1#0001" }], meta });
        const query = squash(calls[0].query);
        expect(query).toContain("location { folderId }");
        expect(query).toContain("createdBy { displayName }");
        expect(query).toContain("meta { cursor hasMoreItems totalCount }");
        expect(calls[0].variables).toMatchObject({
            where: { latest: true, location: { folderId: "f1" } },
            limit: 50
        });
    });

    it("lists global components, with no params", async () => {
        const globals = [{ name: "LoginModal", language: "default", elements: {}, bindings: {} }];
        const { sdk, calls } = createSdk({
            websiteBuilder: { listGlobalComponents: { data: globals, error: null } }
        });

        const result = await sdk.websiteBuilder.listGlobalComponents();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(globals);
        expect(squash(calls[0].query)).toContain("data { name language elements bindings }");
    });

    it("returns the API's error from the response's `error`", async () => {
        const { sdk } = createSdk({
            websiteBuilder: {
                getPageById: { data: null, error: { message: "Not found.", code: "NOT_FOUND" } }
            }
        });

        const result = await sdk.websiteBuilder.getPageById({ id: "x#0001", fields: ["id"] });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Not found.");
        expect(result.error.data).toEqual({ code: "NOT_FOUND" });
    });

    it("rejects missing fields without a request", async () => {
        const { sdk, calls } = createSdk({});

        const result = await sdk.websiteBuilder.getPageByPath({ path: "/home", fields: [] });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(calls).toHaveLength(0);
    });

    it("deletes a page and returns a boolean", async () => {
        const { sdk, calls } = createSdk({
            websiteBuilder: { deletePage: { data: true, error: null } }
        });

        const result = await sdk.websiteBuilder.deletePage({ id: "p1", permanently: true });

        expect(result.isOk()).toBe(true);
        expect(result.value).toBe(true);
        expect(squash(calls[0].query)).toContain(
            "deletePage(id: $id, permanently: $permanently) { data error"
        );
    });
});
