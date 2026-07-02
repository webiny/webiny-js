import { describe, it, expect } from "vitest";
import { Result } from "@webiny/feature/api";
import { RequestTenantLoaderImpl } from "~/features/requestContext/RequestTenantLoader.js";
import { RequestIdentityLoaderImpl } from "~/features/requestContext/RequestIdentityLoader.js";

/**
 * Unit tests for the transport-agnostic LOAD steps: they read the raw value the transport EXTRACT
 * step placed into RawTenantId / RawAuthToken and set TenantContext / IdentityContext.
 */

function rawHolder(initial: string | null = null) {
    let value = initial;
    return {
        get: () => value,
        set: (v: string | null) => {
            value = v;
        }
    };
}

describe("RequestTenantLoader (LOAD)", () => {
    function setup(rawTenantId: string | null, knownTenants: string[]) {
        let setTo: any = undefined;
        const tenantContext = {
            setTenant: (t: any) => {
                setTo = t;
            },
            getTenant: () => setTo
        } as any;
        const getTenantById = {
            execute: async (id: string) =>
                knownTenants.includes(id)
                    ? Result.ok({ id, name: id })
                    : Result.fail({ type: "NOT_FOUND" })
        } as any;
        const loader = new RequestTenantLoaderImpl(
            tenantContext,
            getTenantById,
            rawHolder(rawTenantId)
        );
        return { loader, getSet: () => setTo };
    }

    it("resolves the raw tenant id and sets TenantContext", async () => {
        const { loader, getSet } = setup("acme", ["acme"]);
        await loader.establish();
        expect(getSet()).toEqual({ id: "acme", name: "acme" });
    });

    it("defaults to the root tenant when no raw id was extracted", async () => {
        const { loader, getSet } = setup(null, ["root"]);
        await loader.establish();
        expect(getSet()).toEqual({ id: "root", name: "root" });
    });

    it("does not set the tenant when a non-root id can't be resolved", async () => {
        const { loader, getSet } = setup("ghost", ["root"]);
        await loader.establish();
        expect(getSet()).toBeUndefined();
    });

    it("establishes a bootstrap root tenant when the root tenant isn't installed yet", async () => {
        // Fresh, not-yet-installed environment: no raw id → "root", and "root" isn't in storage.
        // The loader must still establish a (bootstrap) root tenant so the request pipeline and the
        // GraphQL schema build function and the install mutation can create the real root tenant.
        const { loader, getSet } = setup(null, []);
        await loader.establish();
        const tenant = getSet();
        expect(tenant).toBeTruthy();
        expect(tenant.id).toBe("root");
        expect(tenant.isInstalled).toBe(false);
    });
});

describe("RequestIdentityLoader (LOAD)", () => {
    function setup(rawToken: string | null) {
        const authenticated: string[] = [];
        let setIdentity: any = undefined;
        const authentication = {
            authenticate: async (token: string) => {
                authenticated.push(token);
                return { id: token || "anonymous", isAnonymous: () => !token };
            }
        } as any;
        const identityContext = {
            setIdentity: (i: any) => {
                setIdentity = i;
            },
            getIdentity: () => setIdentity
        } as any;
        const loader = new RequestIdentityLoaderImpl(
            authentication,
            identityContext,
            rawHolder(rawToken)
        );
        return { loader, authenticated, getIdentity: () => setIdentity };
    }

    it("authenticates the extracted token and sets IdentityContext", async () => {
        const { loader, authenticated, getIdentity } = setup("tok-123");
        await loader.establish();
        expect(authenticated).toEqual(["tok-123"]);
        expect(getIdentity().id).toBe("tok-123");
    });

    it("authenticates as anonymous (empty token) when no token was extracted", async () => {
        const { loader, authenticated, getIdentity } = setup(null);
        await loader.establish();
        expect(authenticated).toEqual([""]);
        expect(getIdentity().id).toBe("anonymous");
    });
});
