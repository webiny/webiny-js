import { describe, it, expect, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { RequestIdentityEstablisherImpl } from "~/features/requestContext/RequestIdentityEstablisher.js";
import { RequestTenantEstablisherImpl } from "~/features/requestContext/RequestTenantEstablisher.js";

const anonymous = { isAnonymous: () => true } as any;
const authed = { id: "u1", isAnonymous: () => false } as any;

describe("RequestIdentityEstablisher", () => {
    function setup(opts: {
        authExtractors?: Array<{ extract: (e: unknown) => string | null }>;
        authenticate?: (token: string) => Promise<any>;
    }) {
        const setIdentity = vi.fn();
        const authenticate = vi.fn(opts.authenticate ?? (async () => anonymous));
        const establisher = new RequestIdentityEstablisherImpl(
            { authenticate } as any,
            { setIdentity, getIdentity: () => anonymous } as any,
            (opts.authExtractors ?? []) as any
        );
        return { establisher, setIdentity, authenticate };
    }

    it("uses the first token source that authenticates to a non-anonymous identity", async () => {
        const { establisher, setIdentity } = setup({
            authExtractors: [{ extract: () => "" }, { extract: () => "cookie-tok" }],
            authenticate: async token => (token === "cookie-tok" ? authed : anonymous)
        });

        await establisher.establish({});

        expect(setIdentity).toHaveBeenCalledWith(authed);
    });

    it("stops at the first non-anonymous source (cookie not consulted when bearer works)", async () => {
        const cookieExtract = vi.fn(() => "cookie-tok");
        const { establisher, setIdentity } = setup({
            authExtractors: [{ extract: () => "bearer-tok" }, { extract: cookieExtract }],
            authenticate: async token => (token === "bearer-tok" ? authed : anonymous)
        });

        await establisher.establish({});

        expect(setIdentity).toHaveBeenCalledWith(authed);
        expect(cookieExtract).not.toHaveBeenCalled();
    });

    it("falls back to an anonymous identity when no token source applies", async () => {
        const { establisher, setIdentity, authenticate } = setup({
            authExtractors: [{ extract: () => null }],
            authenticate: async () => anonymous
        });

        await establisher.establish({});

        expect(authenticate).toHaveBeenCalledWith("");
        expect(setIdentity).toHaveBeenCalledWith(anonymous);
    });
});

describe("RequestTenantEstablisher", () => {
    function setup(opts: {
        tenantExtractors?: Array<{ extract: (e: unknown) => string | null }>;
        getTenant?: (id: string) => Promise<any>;
    }) {
        const setTenant = vi.fn();
        const execute = vi.fn(opts.getTenant ?? (async (id: string) => Result.ok({ id })));
        const establisher = new RequestTenantEstablisherImpl(
            { setTenant } as any,
            { execute } as any,
            (opts.tenantExtractors ?? []) as any
        );
        return { establisher, setTenant, execute };
    }

    it("sets the tenant from the first extractor that returns an id", async () => {
        const { establisher, setTenant, execute } = setup({
            tenantExtractors: [{ extract: () => null }, { extract: () => "acme" }]
        });

        await establisher.establish({});

        expect(execute).toHaveBeenCalledWith("acme");
        expect(setTenant).toHaveBeenCalledWith({ id: "acme" });
    });

    it("defaults the tenant to 'root' when no extractor returns an id", async () => {
        const { establisher, execute } = setup({ tenantExtractors: [] });

        await establisher.establish({});

        expect(execute).toHaveBeenCalledWith("root");
    });

    it("does not set the tenant when resolution fails", async () => {
        const { establisher, setTenant } = setup({
            tenantExtractors: [{ extract: () => "missing" }],
            getTenant: async () => Result.fail({ type: "NOT_FOUND" })
        });

        await establisher.establish({});

        expect(setTenant).not.toHaveBeenCalled();
    });
});
