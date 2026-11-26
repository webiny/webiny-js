import { describe, it, expect } from "vitest";
import { Result } from "@webiny/feature/api";
import { RequestTenantLoaderImpl } from "~/features/requestContext/RequestTenantLoader.js";
import { RequestIdentityLoaderImpl } from "~/features/requestContext/RequestIdentityLoader.js";

/**
 * Unit tests for the transport-agnostic LOAD steps: they read the raw value the transport EXTRACT
 * step placed into RawTenantId / RawAuthToken, and resolve the tenant / set IdentityContext.
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
        const getTenantById = {
            execute: async (id: string) =>
                knownTenants.includes(id)
                    ? Result.ok({ id, name: id })
                    : Result.fail({ type: "NOT_FOUND" })
        } as any;
        return new RequestTenantLoaderImpl(getTenantById, rawHolder(rawTenantId));
    }

    it("resolves the tenant of the raw tenant id", async () => {
        const loader = setup("acme", ["acme"]);
        await expect(loader.establish()).resolves.toEqual({ id: "acme", name: "acme" });
    });

    it("defaults to the root tenant when no raw id was extracted", async () => {
        const loader = setup(null, ["root"]);
        await expect(loader.establish()).resolves.toEqual({ id: "root", name: "root" });
    });

    it("fails with Tenancy/TenantNotFound when a non-root id can't be resolved", async () => {
        const loader = setup("ghost", ["root"]);
        await expect(loader.establish()).rejects.toMatchObject({
            code: "Tenancy/TenantNotFound",
            data: { tenantId: "ghost" }
        });
    });

    it("resolves a bootstrap root tenant when the root tenant isn't installed yet", async () => {
        // Fresh, not-yet-installed environment: no raw id → "root", and "root" isn't in storage.
        // The loader must still give a (bootstrap) root tenant so the request pipeline and the
        // GraphQL schema build function and the install mutation can create the real root tenant.
        const tenant = await setup(null, []).establish();
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
