import { describe, expect, it } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";
import { PublicUrl, PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { NextjsConfig } from "~/features/nextjs/abstractions.js";
import { NextjsConfig as NextjsConfigImpl } from "~/features/nextjs/NextjsConfig.js";
import { NuxtConfig } from "~/features/nuxt/abstractions.js";
import { NuxtConfig as NuxtConfigImpl } from "~/features/nuxt/NuxtConfig.js";

const createContainer = (urls: { api: string | null; admin: string | null }) => {
    const container = new Container();
    container.registerInstance(TenantContext, { getTenant: () => ({ id: "root" }) } as any);
    container.registerInstance(ApiKeysRepository, {
        getBySlug: async () => Result.ok({ token: "wat_token" })
    } as any);
    container.registerInstance(PublicUrls, {
        getApiUrl: async () => PublicUrl.from(urls.api),
        getAdminUrl: async () => PublicUrl.from(urls.admin)
    });
    container.register(NextjsConfigImpl);
    container.register(NuxtConfigImpl);
    return container;
};

describe("starter kit configs", () => {
    it("fills in the API and Admin URLs from PublicUrls", async () => {
        const container = createContainer({
            api: "https://api.example.com",
            admin: "https://admin.example.com"
        });

        const nextjs = (await container.resolve(NextjsConfig).execute()).build();
        expect(nextjs).toContain("NEXT_PUBLIC_WEBINY_API_HOST=https://api.example.com");
        expect(nextjs).toContain("NEXT_PUBLIC_WEBINY_ADMIN_HOST=https://admin.example.com");

        const nuxt = (await container.resolve(NuxtConfig).execute()).build();
        expect(nuxt).toContain("WEBINY_API_HOST=https://api.example.com");
        expect(nuxt).toContain("WEBINY_ADMIN_HOST=https://admin.example.com");
    });

    it("shows a placeholder for an unknown API URL and leaves out the Admin host", async () => {
        const container = createContainer({ api: null, admin: null });

        const nextjs = (await container.resolve(NextjsConfig).execute()).build();
        expect(nextjs).toContain("NEXT_PUBLIC_WEBINY_API_HOST={API_HOST_URL}");
        expect(nextjs).not.toContain("NEXT_PUBLIC_WEBINY_ADMIN_HOST");
    });
});
