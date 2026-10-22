import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewTargetLinkServiceFeature } from "~/features/notifications/ReviewTargetLinkService/feature.js";

const ADMIN_URL = "https://admin.example.com";

const CMS_PARAMS: ReviewTargetLink.Params = {
    model: "cms.article",
    targetId: "article-1",
    targetRevisionId: "article-1#0001"
};

const PAGE_PARAMS: ReviewTargetLink.Params = {
    model: "wb.page",
    targetId: "page-1",
    targetRevisionId: "page-1#0002"
};

/** The admin URL the fake `WorkflowsAdminUrlService` answers; `null` for no host. */
interface AdminUrlState {
    url: string | null;
}

const admin: AdminUrlState = { url: ADMIN_URL };

class FakeAdminUrl implements WorkflowsAdminUrlService.Interface {
    public async get(): Promise<string | null> {
        return admin.url;
    }
}

class CmsLikePort implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return model.startsWith("cms.");
    }

    public getPath(params: ReviewTargetLink.Params): string {
        return `/cms/content-entries/article?id=${encodeURIComponent(params.targetRevisionId)}`;
    }
}

class PageLikePort implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return model === "wb.page";
    }

    public getPath(params: ReviewTargetLink.Params): string {
        return `/website-builder/pages/editor/${encodeURIComponent(params.targetRevisionId)}`;
    }
}

class OverridingCmsPort implements ReviewTargetLink.Interface {
    public canLink(model: string): boolean {
        return model === "cms.article";
    }

    public getPath(): string {
        return "/overridden";
    }
}

class ThrowingPort implements ReviewTargetLink.Interface {
    public canLink(): boolean {
        return true;
    }

    public getPath(): string {
        throw new Error("secret@example.com is not a valid path.");
    }
}

const CmsLike = ReviewTargetLink.createImplementation({
    implementation: CmsLikePort,
    dependencies: []
});
const PageLike = ReviewTargetLink.createImplementation({
    implementation: PageLikePort,
    dependencies: []
});
const OverridingCms = ReviewTargetLink.createImplementation({
    implementation: OverridingCmsPort,
    dependencies: []
});
const Throwing = ReviewTargetLink.createImplementation({
    implementation: ThrowingPort,
    dependencies: []
});

// If `yarn check:test:types` complains about this parameter type, use
// `Array<ReturnType<typeof ReviewTargetLink.createImplementation>>` instead.
const setup = async (ports: Array<typeof CmsLike> = [CmsLike, PageLike]) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(WorkflowsAdminUrlService, new FakeAdminUrl());
            for (const port of ports) {
                container.register(port);
            }
            ReviewTargetLinkServiceFeature.register(container);
        }
    });
    return {
        tenantContext: context.container.resolve(TenantContext),
        service: context.container.resolve(ReviewTargetLinkService)
    };
};

describe("ReviewTargetLinkService.getUrl (R195, R196)", () => {
    beforeEach(() => {
        admin.url = ADMIN_URL;
        tenantFault.mode = "none";
        loggedErrors.length = 0;
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    it("joins the admin host and the path and appends the current tenant with ?", async () => {
        const { service, tenantContext } = await setup();
        const tenantId = tenantContext.getTenant().id;

        const url = await service.getUrl(PAGE_PARAMS);

        expect(url).toBe(
            `${ADMIN_URL}/website-builder/pages/editor/page-1%230002?tenantId=${encodeURIComponent(tenantId)}`
        );
    });

    it("appends the tenant with & when the path has a query, and keeps %23 untouched", async () => {
        const { service, tenantContext } = await setup();
        const tenantId = tenantContext.getTenant().id;

        const url = await service.getUrl(CMS_PARAMS);

        expect(url).toBe(
            `${ADMIN_URL}/cms/content-entries/article?id=article-1%230001&tenantId=${encodeURIComponent(tenantId)}`
        );
        expect(url).toContain("%23");
        expect(url).not.toContain("%2523");
    });

    it("carries the id of a non-root tenant, encoded", async () => {
        const { service, tenantContext } = await setup();
        const child = { ...tenantContext.getTenant(), id: "child tenant/1" };

        const url = await tenantContext.withTenant(child, () => service.getUrl(PAGE_PARAMS));

        expect(url).toBe(
            `${ADMIN_URL}/website-builder/pages/editor/page-1%230002?tenantId=child%20tenant%2F1`
        );
    });

    it("uses the last registered port that can link the model", async () => {
        const { service, tenantContext } = await setup([CmsLike, OverridingCms]);
        const tenantId = tenantContext.getTenant().id;

        const url = await service.getUrl(CMS_PARAMS);

        expect(url).toBe(`${ADMIN_URL}/overridden?tenantId=${encodeURIComponent(tenantId)}`);
    });

    it("is null when no port can link the model", async () => {
        const { service } = await setup();

        expect(await service.getUrl({ ...CMS_PARAMS, model: "other.thing" })).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("is null, without a log, when there is no admin host", async () => {
        const { service } = await setup();
        admin.url = null;

        expect(await service.getUrl(PAGE_PARAMS)).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("is null, without a log, when there is no current tenant (never a link without tenantId)", async () => {
        const { service } = await setup();
        tenantFault.mode = "missing";

        expect(await service.getUrl(PAGE_PARAMS)).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("is null, without a log, when the current tenant has an empty id (never a link without tenantId)", async () => {
        const { service, tenantContext } = await setup();
        const empty = { ...tenantContext.getTenant(), id: "" };

        const url = await tenantContext.withTenant(empty, () => service.getUrl(PAGE_PARAMS));

        expect(url).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("is null and logs once, with the fixed text and no error text, when the tenant read throws", async () => {
        const { service } = await setup();
        tenantFault.mode = "throws";

        const url = await service.getUrl(PAGE_PARAMS);

        expect(url).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not build the workflow notification link.");
        expect(loggedErrors[0].fields).toEqual({
            errorCode: undefined,
            errorName: "Error",
            model: "wb.page",
            targetId: "page-1"
        });
        expect(JSON.stringify(loggedErrors)).not.toContain("The tenant could not be read.");
    });

    it("is null and logs once when a port throws, without the error text", async () => {
        const { service } = await setup([Throwing]);

        const url = await service.getUrl(CMS_PARAMS);

        expect(url).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not build the workflow notification link.");
        expect(JSON.stringify(loggedErrors)).not.toContain("secret@example.com");
    });

    it("builds the link from the host and the port's path only (Review Focus 6)", async () => {
        const { service } = await setup();
        admin.url = "https://other-admin.example.org";

        const url = await service.getUrl(PAGE_PARAMS);

        expect(
            url!.startsWith("https://other-admin.example.org/website-builder/pages/editor/")
        ).toBe(true);
        expect(url).not.toContain(ADMIN_URL);
    });
});
