### Task 8: `WorkflowsAdminUrlService`, `ReviewTargetLink` port and `ReviewTargetLinkService`

Spec 12, 9.3; D133 (the engine cannot know admin routes; the same port pattern as `ReviewTargetEditor`); R195, R196, R200; A62; Review Focus 6 (the link is built only from the admin host and an encoded path, never from message text). The e-mail link of every notification comes from here; the notifier (Task 10) makes one `getUrl` call per notification.

- `WorkflowsAdminUrlService.get(): Promise<string | null>` (R195): `https://${manifest.admin.cloudfront.domain}` from `ServiceDiscovery.load()` (`@webiny/api-core/features/serviceDiscovery/index.js`, the manifest key `NextjsConfig.getDomains` reads; `domain` is a bare host, so the scheme is prefixed and a trailing slash trimmed). `null` when there is no manifest, no `admin` entry, no `cloudfront.domain` string, and also when `ServiceDiscovery.load()` throws (a missing loader throws). It never fails, never throws and does not log: `ReviewTargetLinkService` is the one place that logs a link problem. `ServiceDiscovery` is a static class, not a DI abstraction, so it is read inline.
- The `ReviewTargetLink` port (R195): multi-registered, `canLink(model: string): boolean` and `getPath(params: ReviewTargetLinkParams): string`, one adapter per app (Task 9), public path `@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js`. The path is tenant-free and starts with `/`.
- `ReviewTargetLinkService.getUrl(params): Promise<string | null>` (R195, R196): picks the last registered port whose `canLink(params.model)` is true (like `ReviewTargetEditorService`), joins `WorkflowsAdminUrlService.get()` and the port's path and appends `tenantId=<encodeURIComponent(current tenant id)>` by string concatenation: `?` when the path has no query, `&` when it already has one (the CMS path has `?id=`). The path is never re-serialised (no `URL`, no `searchParams`, which could re-encode the adapter's `%23`). The admin reads `?tenantId=` in `TenancyProvider` (`new URLSearchParams(window.location.search).get("tenantId")`), so the link opens the review's own tenant. `null` (never a failure) for: no matching port, no admin host, no current tenant (`TenantContext.getTenant()` is `null`/`undefined` or has no id), so a link without `tenantId` is never produced. Any throw (a port, the tenant read, the admin URL service) is caught, logged once with `Logger.error({ errorCode, errorName, model, targetId }, "Could not build the workflow notification link.")` (never the error object or message, R196) and answered with `null`. Callers never log.

**Files:**
- Create: `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/WorkflowsAdminUrlService.ts`
- Create: `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/index.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLink/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLink/index.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/ReviewTargetLinkService.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/index.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FaultyTenantContext.ts`
- Create: `packages/api-workflows/__tests__/notifications/WorkflowsAdminUrlService.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewTargetLinkService.test.ts`

**Interfaces:**
- Consumes:
  - Existing: `ServiceDiscovery`, `IServiceManifestLoader` (`@webiny/api-core/features/serviceDiscovery/index.js`; `static setLoader(loader)`, `static load(): Promise<Manifest | undefined>` where `Manifest` is `GenericRecord<string>` built as `{ [item.name]: item.manifest }`, `static clear()` drops the cached manifest but not the loader), `TenantContext` (`@webiny/api-core/features/tenancy/TenantContext/index.js`; `getTenant()`, `withTenant(tenant, cb)`), `Logger` (`@webiny/api-core/features/logger/index.js`), `PersistenceErrorSource` (`~/domain/PersistenceErrorSource.js`, an `Error` with an optional `code`).
  - Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`).
- Produces (matches the contract):
  - `IWorkflowsAdminUrlService { get(): Promise<string | null> }`, `WorkflowsAdminUrlService = createAbstraction<IWorkflowsAdminUrlService>("WorkflowsAdminUrlService")` (namespace `Interface`), the implementation `WorkflowsAdminUrlService` (dependencies `[]`) and `WorkflowsAdminUrlServiceFeature`.
  - `ReviewTargetLinkParams { model: string; targetId: string; targetRevisionId: string }`, `IReviewTargetLink { canLink(model: string): boolean; getPath(params: ReviewTargetLinkParams): string }`, `ReviewTargetLink = createAbstraction<IReviewTargetLink>("ReviewTargetLink")` with the namespace `Interface` and `Params`. Public: `@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js` (Task 9 imports it).
  - `IReviewTargetLinkService { getUrl(params: ReviewTargetLinkParams): Promise<string | null> }`, `ReviewTargetLinkService = createAbstraction<IReviewTargetLinkService>("ReviewTargetLinkService")` (namespace `Interface`), the implementation `ReviewTargetLinkService` (dependencies `[WorkflowsAdminUrlService, TenantContext, Logger, [ReviewTargetLink, { multiple: true }]]`) and `ReviewTargetLinkServiceFeature`. `ReviewNotificationsFeature` (Task 12) registers both features; until then the tests register them in `setup`. Consumed by Tasks 9 (the port), 10 (`getUrl`).
  - Test helper `__tests__/__helpers/FaultyTenantContext.ts`: `registerFaultyTenantContext(container)` and `tenantFault: { mode: "none" | "missing" | "throws" }` (reset to `"none"` after each test). Task 10 reuses it for the notifier's "no current tenant" and "throwing tenant read" cases.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FaultyTenantContext.ts`:

```ts
import type { Container } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export type TenantFaultMode = "none" | "missing" | "throws";

export interface TenantFault {
    mode: TenantFaultMode;
}

/**
 * How `getTenant` behaves: `none` passes through, `missing` returns `null` (no current tenant),
 * `throws` throws. Set it right before the call under test and reset it to `none` after each
 * test.
 */
export const tenantFault: TenantFault = { mode: "none" };

class FaultyTenantContext implements TenantContext.Interface {
    public constructor(private decoratee: TenantContext.Interface) {}

    public getTenant(): Tenant {
        if (tenantFault.mode === "throws") {
            throw new Error("The tenant could not be read.");
        }
        if (tenantFault.mode === "missing") {
            return null as unknown as Tenant;
        }
        return this.decoratee.getTenant();
    }

    public setTenant(tenant: Tenant): void {
        this.decoratee.setTenant(tenant);
    }

    public withRootTenant<T>(cb: () => T): Promise<T> {
        return this.decoratee.withRootTenant(cb);
    }

    public withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        return this.decoratee.withEachTenant(tenants, cb);
    }

    public withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        return this.decoratee.withTenant(tenant, cb);
    }
}

/** Decorates `TenantContext` so a test can make the current tenant missing or unreadable. */
export const registerFaultyTenantContext = (container: Container): void => {
    container.registerDecorator(
        TenantContext.createDecorator({ decorator: FaultyTenantContext, dependencies: [] })
    );
};
```

Create `packages/api-workflows/__tests__/notifications/WorkflowsAdminUrlService.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    ServiceDiscovery,
    type IServiceManifest
} from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    WorkflowsAdminUrlService,
    WorkflowsAdminUrlServiceFeature
} from "~/features/notifications/WorkflowsAdminUrlService/index.js";

const setupService = async (manifests: IServiceManifest[] | undefined | Error) => {
    ServiceDiscovery.setLoader({
        load: async () => {
            if (manifests instanceof Error) {
                throw manifests;
            }
            return manifests;
        }
    });
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            WorkflowsAdminUrlServiceFeature.register(container);
        }
    });
    return context.container.resolve(WorkflowsAdminUrlService);
};

describe("WorkflowsAdminUrlService (R195)", () => {
    beforeEach(() => {
        ServiceDiscovery.clear();
        loggedErrors.length = 0;
    });

    afterEach(() => {
        ServiceDiscovery.clear();
    });

    it("is https plus the admin CloudFront domain", async () => {
        const service = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "d1234.cloudfront.net" } } },
            { name: "api", manifest: { cloudfront: { domain: "api.cloudfront.net" } } }
        ]);

        expect(await service.get()).toBe("https://d1234.cloudfront.net");
    });

    it("has no trailing slash", async () => {
        const service = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "admin.example.com/" } } }
        ]);

        expect(await service.get()).toBe("https://admin.example.com");
    });

    it("is null when there is no manifest", async () => {
        const service = await setupService(undefined);

        expect(await service.get()).toBeNull();
    });

    it("is null when the manifest has no admin entry", async () => {
        const service = await setupService([
            { name: "api", manifest: { cloudfront: { domain: "api.cloudfront.net" } } }
        ]);

        expect(await service.get()).toBeNull();
    });

    it("is null when the admin entry has no CloudFront domain", async () => {
        const withoutCloudfront = await setupService([{ name: "admin", manifest: {} }]);
        expect(await withoutCloudfront.get()).toBeNull();

        ServiceDiscovery.clear();
        const blankDomain = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: "  " } } }
        ]);
        expect(await blankDomain.get()).toBeNull();

        ServiceDiscovery.clear();
        const notAString = await setupService([
            { name: "admin", manifest: { cloudfront: { domain: 42 } } }
        ]);
        expect(await notAString.get()).toBeNull();
    });

    it("is null, does not reject and does not log when the loader throws", async () => {
        const service = await setupService(new Error("The manifest could not be loaded."));

        expect(await service.get()).toBeNull();
        expect(loggedErrors).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewTargetLinkService.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import {
    ReviewTargetLinkService,
    ReviewTargetLinkServiceFeature
} from "~/features/notifications/ReviewTargetLinkService/index.js";

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

        expect(url!.startsWith("https://other-admin.example.org/website-builder/pages/editor/")).toBe(
            true
        );
        expect(url).not.toContain(ADMIN_URL);
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

`yarn test packages/api-workflows/__tests__/notifications/WorkflowsAdminUrlService.test.ts 2>&1 | tail -50`
Expected: FAIL, `Cannot find module '~/features/notifications/WorkflowsAdminUrlService/index.js'`.

`yarn test packages/api-workflows/__tests__/notifications/ReviewTargetLinkService.test.ts 2>&1 | tail -50`
Expected: FAIL, `Cannot find module '~/features/notifications/WorkflowsAdminUrlService/index.js'` (and the two other new paths).

Run both with `yarn test:os` (one at a time).
Expected: the same failures.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IWorkflowsAdminUrlService {
    /**
     * The admin app's URL without a trailing slash, e.g. `https://d1234.cloudfront.net`, or `null`
     * when service discovery has no manifest or no admin entry, or fails. Never rejects, never
     * logs.
     */
    get(): Promise<string | null>;
}

/**
 * Where the admin app lives (R195, user answer Q3): the admin CloudFront domain from service
 * discovery. E-mail links are built on it. A deployment without it sends e-mail without a link.
 */
export const WorkflowsAdminUrlService = createAbstraction<IWorkflowsAdminUrlService>(
    "WorkflowsAdminUrlService"
);

export namespace WorkflowsAdminUrlService {
    export type Interface = IWorkflowsAdminUrlService;
}
```

Create `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/WorkflowsAdminUrlService.ts`:

```ts
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { WorkflowsAdminUrlService as Abstraction } from "./abstractions.js";

class WorkflowsAdminUrlServiceImpl implements Abstraction.Interface {
    public async get(): Promise<string | null> {
        try {
            // The same manifest key `NextjsConfig.getDomains` reads; `domain` is a bare host.
            const manifest = await ServiceDiscovery.load();
            const domain: unknown = manifest?.admin?.cloudfront?.domain;
            if (typeof domain !== "string") {
                return null;
            }
            const host = domain.trim().replace(/\/+$/, "");
            return host === "" ? null : `https://${host}`;
        } catch {
            // A missing loader throws. No link is not an error, and the link service logs the
            // problems that matter (R195).
            return null;
        }
    }
}

export const WorkflowsAdminUrlService = Abstraction.createImplementation({
    implementation: WorkflowsAdminUrlServiceImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowsAdminUrlService } from "./WorkflowsAdminUrlService.js";

export const WorkflowsAdminUrlServiceFeature = createFeature({
    name: "WorkflowNotifications/WorkflowsAdminUrlService",
    register(container) {
        container.register(WorkflowsAdminUrlService);
    }
});
```

Create `packages/api-workflows/src/features/notifications/WorkflowsAdminUrlService/index.ts`:

```ts
export { WorkflowsAdminUrlServiceFeature } from "./feature.js";
export { WorkflowsAdminUrlService } from "./abstractions.js";
export type { IWorkflowsAdminUrlService } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLink/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetLinkParams {
    /** Namespace id, e.g. "cms.article" or "wb.page" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface IReviewTargetLink {
    /** Whether this adapter knows the admin route of the namespace, e.g. "cms.article". */
    canLink(model: string): boolean;
    /**
     * The admin path that opens the revision, starting with `/` and without the host, a tenant
     * or a fragment. The ids are encoded (`encodeURIComponent`). Never reads the target.
     */
    getPath(params: ReviewTargetLinkParams): string;
}

/**
 * Where a review's content is opened in the admin (R195, D133): the engine cannot know the admin
 * routes, so each app registers one adapter per namespace (`cms.*` in api-headless-cms-workflows,
 * `wb.page` in api-website-builder-workflows). The last registered match wins. The engine reaches
 * it only through `ReviewTargetLinkService`.
 */
export const ReviewTargetLink = createAbstraction<IReviewTargetLink>("ReviewTargetLink");

export namespace ReviewTargetLink {
    export type Interface = IReviewTargetLink;
    export type Params = ReviewTargetLinkParams;
}
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLink/index.ts`:

```ts
export { ReviewTargetLink } from "./abstractions.js";
export type { IReviewTargetLink, ReviewTargetLinkParams } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ReviewTargetLinkParams } from "~/features/notifications/ReviewTargetLink/abstractions.js";

export interface IReviewTargetLinkService {
    /**
     * The admin URL that opens the revision in the review's own tenant, or `null` when there is
     * no adapter for the namespace, no admin host or no current tenant. Never rejects; a throw is
     * logged here once and answered with `null`.
     */
    getUrl(params: ReviewTargetLinkParams): Promise<string | null>;
}

/**
 * Builds the e-mail link of a notification (R195). Internal (D132): no permission check. Callers
 * never log a link problem.
 */
export const ReviewTargetLinkService =
    createAbstraction<IReviewTargetLinkService>("ReviewTargetLinkService");

export namespace ReviewTargetLinkService {
    export type Interface = IReviewTargetLinkService;
}
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/ReviewTargetLinkService.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/abstractions.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/abstractions.js";
import { ReviewTargetLinkService as Abstraction } from "./abstractions.js";

class ReviewTargetLinkServiceImpl implements Abstraction.Interface {
    public constructor(
        private adminUrl: WorkflowsAdminUrlService.Interface,
        private tenantContext: TenantContext.Interface,
        private logger: Logger.Interface,
        private links: ReviewTargetLink.Interface[]
    ) {}

    public async getUrl(params: ReviewTargetLink.Params): Promise<string | null> {
        try {
            // Several adapters may match; the last registered wins, like `ReviewTargetEditorService`.
            const link = [...this.links].reverse().find(item => item.canLink(params.model));
            if (!link) {
                return null;
            }
            const adminUrl = await this.adminUrl.get();
            if (!adminUrl) {
                return null;
            }
            // The tenant the review lives in: the admin's `TenancyProvider` opens it from the
            // `tenantId` query parameter. No tenant, no link (never a link without `tenantId`).
            const tenantId = this.tenantContext.getTenant()?.id;
            if (!tenantId) {
                return null;
            }

            // String concatenation only: the adapter's encoded path (`%23`) is never re-serialised.
            const path = link.getPath(params);
            const separator = path.includes("?") ? "&" : "?";
            return `${adminUrl}${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
        } catch (error) {
            // Code and name only: the message of a port or tenant error is not ours to print.
            const source: PersistenceErrorSource =
                error instanceof Error ? error : new Error(String(error));
            this.logger.error(
                {
                    errorCode: source.code,
                    errorName: source.name,
                    model: params.model,
                    targetId: params.targetId
                },
                "Could not build the workflow notification link."
            );
            return null;
        }
    }
}

export const ReviewTargetLinkService = Abstraction.createImplementation({
    implementation: ReviewTargetLinkServiceImpl,
    dependencies: [
        WorkflowsAdminUrlService,
        TenantContext,
        Logger,
        [ReviewTargetLink, { multiple: true }]
    ]
});
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewTargetLinkService } from "./ReviewTargetLinkService.js";

export const ReviewTargetLinkServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewTargetLinkService",
    register(container) {
        container.register(ReviewTargetLinkService);
    }
});
```

Create `packages/api-workflows/src/features/notifications/ReviewTargetLinkService/index.ts`:

```ts
export { ReviewTargetLinkServiceFeature } from "./feature.js";
export { ReviewTargetLinkService } from "./abstractions.js";
export type { IReviewTargetLinkService } from "./abstractions.js";
```

- [ ] **Step 4: Run the tests to see them pass**

`yarn test packages/api-workflows/__tests__/notifications/WorkflowsAdminUrlService.test.ts 2>&1 | tail -50`
Expected: PASS.

`yarn test packages/api-workflows/__tests__/notifications/ReviewTargetLinkService.test.ts 2>&1 | tail -50`
Expected: PASS.

Run both with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

Nothing existing is modified. The ports follow the `ReviewTargetEditor` pattern, and the context the new tests decorate (`TenantContext`) is the one every workflows test boots, so run the registration and one tenant-sensitive file:

`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50` and `yarn test packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts 2>&1 | tail -50`, and the same two with `yarn test:os` (one at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): add the admin URL service and the review target link port and service" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
