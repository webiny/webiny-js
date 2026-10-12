### Task 15: WB package wiring, test harness, page reading and access

R47, R51, R65, R66, R75, R77, R78, R82, A25, A28. The Website Builder side of the target adapter, evaluated as the current identity:

- `WbPageTargetReader` reads a `wb.page` revision (page model through `PageModelProvider`, revision through CMS `GetRevisionByIdUseCase`, mapped with `EntryToPageMapper`).
- `WbPageAccess`: read = `WbPermissions.canRead("page") && WbPermissions.canAccess("page", page)`; write = read AND `WbPermissions.canEdit("page", page)` (WB `UpdatePageUseCase` loads the page through `GetPageByIdUseCase` first, R82); delete = read AND `WbPermissions.canDelete("page", page)` (as `TrashPageUseCase`); each AND folder-level permissions on the page's folder inline in each check, as `CmsEntryAccess` does (pages are CMS entries; the ACO CMS decorators apply to them in production, R78). `canWriteAnyPage()` is the entity-level `canEdit("page")` check WB itself makes before loading a page; the request wrapper uses it so a user without page permissions learns nothing about which pages exist (R75). `canDeleteAnyPage()` is the entity-level delete check (`canDelete("page", { createdBy: <current identity> })`, so an own-only delete permission passes); the cancel-for-delete wrapper uses it before it reads a page or lists reviews (R86).
- `WbPageReviewNamespace` registers `wb.page` for the page model into the CMS package's `CmsEntryReviewNamespace` (R51), so the single CMS handlers (revision null, save block) cover pages.

Also wires the package dependencies (R65), the package's `ci.config.json` (R77: `["ddb", "ddb-os,ddb"]`; the test presets fall back to the DDB preset for WB, `packages/build-tools/testing/presets.js`) and a test harness mirroring `api-website-builder/__tests__/utils/useHandler.ts` plus the workflows features.

**Files:**
- Modify: `packages/api-website-builder-workflows/package.json`
- Create: `packages/api-website-builder-workflows/ci.config.json`
- Create: `packages/api-website-builder-workflows/src/constants.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewNamespace.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/WbPageTargetReader.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageAccess/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageAccess/WbPageAccess.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageAccess/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/NoopInvalidateAssetCacheTask.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/cmsModel.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/identities.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FakeFolderLevelPermissions.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FakeListUserTeams.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/userContext.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/pages.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts`

**Interfaces:**
- Consumes: `PageModelProvider`, `WbPage` (`@webiny/api-website-builder/domain/page/abstractions.js`), `EntryToPageMapper` (`.../domain/page/EntryToPageMapper.js`), `PAGE_MODEL_ID` (`.../domain/page/page.model.js`), `ROOT_FOLDER` (`@webiny/api-website-builder/constants.js`), `WbPermissions` (`.../features/permissions/abstractions.js`), `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`), `GetRevisionByIdUseCase`, `FolderLevelPermissions`, `CmsEntryReviewNamespace` (Task 7; the test resolves the namespace inline).
- Produces:
  - `WB_PAGE_NAMESPACE = "wb.page"`, `WB_PAGE_FOLDER_TYPE = "wb:page"` (`src/constants.ts`).
  - `WbPageTarget { model: CmsModel; page: WbPage }`, `WbPageTargetReadParams { model: string; targetRevisionId: string }`, `WbPageTargetReader.Interface { read(params): Promise<WbPageTarget | null> }`.
  - `WbPageAccess.Interface { canWriteAnyPage(): Promise<boolean>; canDeleteAnyPage(): Promise<boolean>; canRead(target: WbPageTarget): Promise<boolean>; canWrite(target: WbPageTarget): Promise<boolean>; canDelete(target: WbPageTarget): Promise<boolean> }`.
  - `WbPageReviewNamespace` (`CmsEntryReviewNamespace` implementation).
  - `WbTargetFeature` (registered by `WebsiteBuilderWorkflowsFeature`); Task 16 adds the ports and handlers.
  - Test helpers: `createContextHandler(params)`, `createUserContext({ identity, permissions, permissionsByIdentity, legacyPlugins })`, `createPage(context, { title, folderId? })`, `getPageModel(context)`, `expectOk`, identities and `WB_READER`, `WB_WRITER`, `WB_WRITE_ONLY`, `WB_DELETER`, `WB_OWN_WRITER`, `WORKFLOWS_EDITOR`, `WORKFLOWS_REASSIGN`, `FakeFolderLevelPermissions` + `folderLevels`, `FakeListUserTeams`.

- [ ] **Step 1: Dependencies**

In `packages/api-website-builder-workflows/package.json`:
- `dependencies`: add `"@webiny/api-aco": "0.0.0"`, `"@webiny/api-headless-cms": "0.0.0"` (moved from `devDependencies`), `"@webiny/api-headless-cms-workflows": "0.0.0"`, `"@webiny/api-workflows": "0.0.0"` (keep the list alphabetical).
- `devDependencies`: remove `@webiny/api-headless-cms`; add `"@webiny/background-tasks": "0.0.0"`, `"@webiny/di": "^1.1.0"`, `"@webiny/languages": "0.0.0"`.

Create `packages/api-website-builder-workflows/ci.config.json` (R77):

```json
{
  "$schema": "../../.github/workflows/ci.config.schema.json",
  "vitest": {
    "storageOps": ["ddb", "ddb-os,ddb"]
  }
}
```

Run `yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio` and fix whatever `adio` reports before continuing.

- [ ] **Step 2: Write the test harness and the failing test**

Create `packages/api-website-builder-workflows/__tests__/__helpers/NoopInvalidateAssetCacheTask.ts`:

```ts
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * A no-op "invalidateAssetCache" task definition, as in `api-website-builder`'s tests: page flows
 * trigger it and `TaskService.trigger` requires the definition to exist. The mock TaskService never
 * runs it.
 */
class NoopInvalidateAssetCacheTaskHandlerImpl implements TaskHandler.Interface {
    async run({ controller }: TaskHandler.RunParams) {
        return controller.response.done();
    }
}

const NoopInvalidateAssetCacheTaskHandler = TaskHandler.createImplementation({
    implementation: NoopInvalidateAssetCacheTaskHandlerImpl,
    dependencies: []
});

class NoopInvalidateAssetCacheTaskImplementation implements TaskDefinition.Interface {
    id = "invalidateAssetCache";
    title = "Invalidate Asset Cache (test no-op)";
    isPrivate = true;

    handler = NoopInvalidateAssetCacheTaskHandler;
}

export const NoopInvalidateAssetCacheTaskDefinition = TaskDefinition.createImplementation({
    implementation: NoopInvalidateAssetCacheTaskImplementation,
    dependencies: []
});
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/cmsModel.ts`:

```ts
import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

/**
 * A public CMS model next to the pages, so WB tests can store a Headless CMS workflow and prove the
 * WB wrappers never touch it (R46).
 */
export const ARTICLE_NAMESPACE = "cms.article";

const group = {
    id: "default",
    name: "Default",
    description: "",
    slug: "default",
    icon: { name: "fa/fas", type: "fa/fas" }
};

const article = {
    modelId: "article",
    name: "Article",
    group: group.slug,
    titleFieldId: "title",
    description: "",
    icon: null,
    singularApiName: "Article",
    pluralApiName: "Articles",
    layout: [["title"]],
    fields: [
        {
            id: "title",
            storageId: "text@title",
            fieldId: "title",
            type: "text",
            label: "Title",
            validation: [],
            listValidation: []
        }
    ]
};

export const createArticleModelPlugins = () => {
    return [createModelPlugin(article), createModelGroupPlugin(group)];
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`:

```ts
import type { Container } from "@webiny/di";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { WebsiteBuilderWorkflowsFeature } from "~/index.js";
import { NoopInvalidateAssetCacheTaskDefinition } from "./NoopInvalidateAssetCacheTask.js";
import { createArticleModelPlugins } from "./cmsModel.js";

/**
 * Website Builder as in `api-website-builder`'s `useHandler`, plus the workflows features in the
 * production order (`registerApiRequestStack.ts`): WB workflows next to WB, then the engine and
 * the CMS workflows package, whose single handlers cover pages (R51). ACO is not registered, so a
 * no-op FLP stands in; tests replace it with the fake one through `legacyPlugins`. One public CMS
 * model ("article") exists for cross-app tests.
 */
export const createContextHandler = (params: CmsTestHandlerParams = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createArticleModelPlugins(),
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
                container.register(NoopFolderLevelPermissions);
            },
            ...[params.legacyPlugins].flat(Infinity as 1).filter(Boolean)
        ],
        setup: container => {
            BackgroundTasksFeature.register(container);
            WebsiteBuilderFeature.register(container);
            WebsiteBuilderWorkflowsFeature.register(container);
            LanguagesExtension.register(container);
            container.registerInstance(TaskService, createMockTaskService());
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
        }
    });

    return {
        context: () => getContext()
    };
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/identities.ts`:

```ts
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";

/** The default identity of `createCmsTestHandler`. */
export const ADMIN: IdentityData = { id: "id-12345678", type: "admin", displayName: "John Doe" };
export const REQUESTER: IdentityData = {
    id: "user-requester",
    type: "admin",
    displayName: "Rita Requester"
};
export const REVIEWER: IdentityData = {
    id: "user-reviewer",
    type: "admin",
    displayName: "Rob Reviewer"
};
export const OTHER_REVIEWER: IdentityData = {
    id: "user-other-reviewer",
    type: "admin",
    displayName: "Olga Reviewer"
};
export const READER: IdentityData = { id: "user-reader", type: "admin", displayName: "Rae Reader" };
export const WRITER: IdentityData = { id: "user-writer", type: "admin", displayName: "Wes Writer" };
export const REASSIGNER: IdentityData = {
    id: "user-reassigner",
    type: "admin",
    displayName: "Rhea Reassigner"
};
export const EDITOR: IdentityData = { id: "user-editor", type: "admin", displayName: "Eddie Editor" };
export const NOBODY: IdentityData = { id: "user-nobody", type: "admin", displayName: "Nora Nobody" };

/** The team of the test workflow's only step. */
export const REVIEW_TEAM = "team-1";

export const WB_READER: SecurityPermission[] = [{ name: "wb.page", rwd: "r" }];
export const WB_WRITER: SecurityPermission[] = [{ name: "wb.page", rwd: "rw" }];
/** Write without read: WB cannot load the page, so it cannot update it (R82). */
export const WB_WRITE_ONLY: SecurityPermission[] = [{ name: "wb.page", rwd: "w" }];
/** Reads, writes and deletes pages (may trash and delete them, D134). */
export const WB_DELETER: SecurityPermission[] = [{ name: "wb.page", rwd: "rwd" }];
export const WB_OWN_WRITER: SecurityPermission[] = [{ name: "wb.page", rwd: "rw", own: true }];
export const WORKFLOWS_EDITOR: SecurityPermission = { name: "workflows", editor: true };
export const WORKFLOWS_REASSIGN: SecurityPermission = { name: "workflows", reassign: true };

export const toActor = (identity: IdentityData): Actor => {
    return {
        type: "user",
        id: identity.id,
        displayName: identity.displayName,
        identityType: identity.type
    };
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/FakeFolderLevelPermissions.ts` with exactly the content of `packages/api-headless-cms-workflows/__tests__/__helpers/FakeFolderLevelPermissions.ts` (Task 7; test helpers are not shared across packages).

Create `packages/api-website-builder-workflows/__tests__/__helpers/FakeListUserTeams.ts` with exactly the content of `packages/api-headless-cms-workflows/__tests__/__helpers/FakeListUserTeams.ts` (Task 12).

Create `packages/api-website-builder-workflows/__tests__/__helpers/userContext.ts`:

```ts
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "./handler.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";

/** Both reviewers are in the test step's team; nobody else is in any team. */
const TEAMS: Record<string, string[]> = {
    [REVIEWER.id]: [REVIEW_TEAM],
    [OTHER_REVIEWER.id]: [REVIEW_TEAM]
};

export interface UserContextParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    legacyPlugins?: unknown[];
}

/** A request context as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserContext = async (params: UserContextParams = {}): Promise<CmsContext> => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
    return (await context()) as CmsContext;
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/pages.ts`:

```ts
import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export const getPageModel = (context: CmsContext): Promise<CmsModel> => {
    return context.container.resolve(PageModelProvider).get();
};

export interface PageParams {
    title: string;
    /** Defaults to the root folder. */
    folderId?: string;
}

let pathCounter = 0;

/** Creates a draft page (revision 1) as the context's identity. */
export const createPage = async (context: CmsContext, params: PageParams): Promise<WbPage> => {
    pathCounter++;
    return expectOk(
        await context.container.resolve(CreatePageUseCase).execute({
            properties: { title: params.title, path: `/workflow-page-${pathCounter}` },
            metadata: {},
            bindings: {},
            elements: {},
            location: { folderId: params.folderId ?? "root" }
        })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, getPageModel } from "~tests/__helpers/pages.js";
import {
    NOBODY,
    READER,
    WB_DELETER,
    WB_OWN_WRITER,
    WB_READER,
    WB_WRITE_ONLY,
    WB_WRITER,
    WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";

const createAccess = async (identity: IdentityData, permissions: SecurityPermission[]) => {
    const context = await createUserContext({ identity, permissions });
    return {
        targets: context.container.resolve(WbPageTargetReader),
        access: context.container.resolve(WbPageAccess)
    };
};

describe("WB page reading and access", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("reads a page revision and lets a reader read but not write it", async () => {
        const page = await createPage(await createUserContext(), { title: "Page A" });
        const { targets, access } = await createAccess(READER, WB_READER);

        const target = await targets.read({ model: "wb.page", targetRevisionId: page.id });

        expect(target?.page.id).toBe(page.id);
        expect(target?.page.properties.title).toBe("Page A");
        expect(await access.canRead(target!)).toBe(true);
        expect(await access.canWrite(target!)).toBe(false);
    });

    it("lets a writer write and refuses a user without page permissions", async () => {
        const page = await createPage(await createUserContext(), { title: "Page A" });
        const writer = await createAccess(WRITER, WB_WRITER);
        const nobody = await createAccess(NOBODY, []);

        const writerTarget = await writer.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });
        const nobodyTarget = await nobody.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });

        expect(await writer.access.canWrite(writerTarget!)).toBe(true);
        expect(await writer.access.canWriteAnyPage()).toBe(true);
        expect(await writer.access.canDelete(writerTarget!)).toBe(false);
        expect(await writer.access.canDeleteAnyPage()).toBe(false);
        expect(await nobody.access.canDeleteAnyPage()).toBe(false);
        expect(await nobody.access.canRead(nobodyTarget!)).toBe(false);
        expect(await nobody.access.canWriteAnyPage()).toBe(false);
    });

    it("needs read access to write and delete access to delete (R82, D134)", async () => {
        const page = await createPage(await createUserContext(), { title: "Page A" });
        const writeOnly = await createAccess(WRITER, WB_WRITE_ONLY);
        const deleter = await createAccess(WRITER, WB_DELETER);

        const writeOnlyTarget = await writeOnly.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });
        const deleterTarget = await deleter.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });

        expect(await writeOnly.access.canWrite(writeOnlyTarget!)).toBe(false);
        expect(await deleter.access.canDelete(deleterTarget!)).toBe(true);
        expect(await deleter.access.canDeleteAnyPage()).toBe(true);
    });

    it("finds no target for a missing revision or another app's namespace", async () => {
        const page = await createPage(await createUserContext(), { title: "Page A" });
        const { targets } = await createAccess(READER, WB_READER);

        const missing = await targets.read({
            model: "wb.page",
            targetRevisionId: `${page.entryId}#0009`
        });
        const otherApp = await targets.read({ model: "cms.article", targetRevisionId: page.id });

        expect(missing).toBeNull();
        expect(otherApp).toBeNull();
    });

    it("honours own-only page permissions", async () => {
        const writerContext = await createUserContext({ identity: WRITER, permissions: WB_WRITER });
        const page = await createPage(writerContext, { title: "Own page" });
        const owner = await createAccess(WRITER, WB_OWN_WRITER);
        const other = await createAccess(READER, WB_OWN_WRITER);

        const ownerTarget = await owner.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });
        const otherTarget = await other.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });

        expect(await owner.access.canWrite(ownerTarget!)).toBe(true);
        expect(await other.access.canRead(otherTarget!)).toBe(false);
        expect(await other.access.canWrite(otherTarget!)).toBe(false);
    });

    it("applies folder-level permissions to read and write", async () => {
        const admin = await createUserContext();
        const locked = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
        const viewed = await createPage(admin, { title: "Viewed", folderId: "folder-viewed" });
        folderLevels.set("folder-locked", new Map([[WRITER.id, "no-access"]]));
        folderLevels.set("folder-viewed", new Map([[WRITER.id, "viewer"]]));
        const { targets, access } = await createAccess(WRITER, WB_DELETER);

        const lockedTarget = await targets.read({ model: "wb.page", targetRevisionId: locked.id });
        const viewedTarget = await targets.read({ model: "wb.page", targetRevisionId: viewed.id });

        expect(await access.canRead(lockedTarget!)).toBe(false);
        expect(await access.canRead(viewedTarget!)).toBe(true);
        expect(await access.canWrite(viewedTarget!)).toBe(false);
        expect(await access.canDelete(viewedTarget!)).toBe(false);
    });

    it("registers wb.page as the review namespace of pages (R51)", async () => {
        const context = await createUserContext();
        const namespaces = context.container.resolveAll(CmsEntryReviewNamespace);

        const model = await getPageModel(context);
        // The last registered non-null namespace wins (R51).
        const resolved = [...namespaces]
            .reverse()
            .map(namespace => namespace.resolve(model))
            .find(Boolean);

        expect(resolved).toBe("wb.page");
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/target/WbPageTargetReader/index.js`.

- [ ] **Step 4: Constants and the namespace**

Create `packages/api-website-builder-workflows/src/constants.ts` (the root folder id comes from `@webiny/api-website-builder/constants.js`):

```ts
/** The review namespace of Website Builder pages (D15, D42). */
export const WB_PAGE_NAMESPACE = "wb.page";
/** ACO folder type of pages; `TargetContext.folder.type` (R66). */
export const WB_PAGE_FOLDER_TYPE = "wb:page";
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewNamespace.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Pages are entries of the private CMS model `wbyWbPage` (`wbPage` with legacy models); their
 * review namespace is `wb.page`, so the single CMS handlers (revision null, save block) cover them
 * (D59, R51).
 */
class WbPageReviewNamespaceImpl implements CmsEntryReviewNamespace.Interface {
    public resolve(model: CmsModel): string | null {
        return model.modelId === PAGE_MODEL_ID ? WB_PAGE_NAMESPACE : null;
    }
}

export const WbPageReviewNamespace = CmsEntryReviewNamespace.createImplementation({
    implementation: WbPageReviewNamespaceImpl,
    dependencies: []
});
```

- [ ] **Step 5: Page reader and access**

Create `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

export interface WbPageTargetReadParams {
    /** Namespace id; only `wb.page` has targets here. */
    model: string;
    targetRevisionId: string;
}

export interface WbPageTarget {
    /** The CMS page model, for `UpdateEntrySystemUseCase`. */
    model: CmsModel;
    page: WbPage;
}

export interface IWbPageTargetReader {
    /**
     * Reads the page revision. `null` for another namespace or a missing revision; other failures
     * are thrown. No access check: callers decide with `WbPageAccess`.
     */
    read(params: WbPageTargetReadParams): Promise<WbPageTarget | null>;
}

/** Loads a page revision for the `wb.page` adapter and wrappers (R47). */
export const WbPageTargetReader = createAbstraction<IWbPageTargetReader>("WbPageTargetReader");

export namespace WbPageTargetReader {
    export type Interface = IWbPageTargetReader;
    export type Params = WbPageTargetReadParams;
    export type Target = WbPageTarget;
}
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/WbPageTargetReader.ts`:

```ts
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { EntryToPageMapper } from "@webiny/api-website-builder/domain/page/EntryToPageMapper.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader as Abstraction } from "./abstractions.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

/**
 * The page model is private (`authorization: false`), so `PageModelProvider` reads it for any
 * identity as the current one; nothing reads models without authorization (A19).
 */
class WbPageTargetReaderImpl implements Abstraction.Interface {
    public constructor(
        private pageModelProvider: PageModelProvider.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface
    ) {}

    public async read(params: Abstraction.Params): Promise<Abstraction.Target | null> {
        if (params.model !== WB_PAGE_NAMESPACE) {
            return null;
        }

        const model = await this.pageModelProvider.get();
        const entry = await this.getRevisionById.execute(model, params.targetRevisionId);
        if (entry.isFail()) {
            if (entry.error.code === ENTRY_NOT_FOUND) {
                return null;
            }
            throw entry.error;
        }

        return { model, page: EntryToPageMapper.toPage(entry.value) };
    }
}

export const WbPageTargetReader = Abstraction.createImplementation({
    implementation: WbPageTargetReaderImpl,
    dependencies: [PageModelProvider, GetRevisionByIdUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/index.ts`:

```ts
export { WbPageTargetReader } from "./abstractions.js";
```

(Consumers use the namespace types `WbPageTargetReader.Target` / `.Params`.)

Create `packages/api-website-builder-workflows/src/features/target/WbPageAccess/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { WbPageTarget } from "../WbPageTargetReader/abstractions.js";

export interface IWbPageAccess {
    /**
     * Entity-level write permission (any page), as WB checks it before loading a page; lets the
     * request wrapper refuse before it reads anything (R75).
     */
    canWriteAnyPage(): Promise<boolean>;
    /**
     * Entity-level delete permission (any page; an own-only permission passes), checked before
     * anything is read so the cancel-for-delete wrapper reveals nothing (R86).
     */
    canDeleteAnyPage(): Promise<boolean>;
    /** Read access of the current identity (review actions, get review). */
    canRead(target: WbPageTarget): Promise<boolean>;
    /** Write access of the current identity (request a review, D77); includes read (R82). */
    canWrite(target: WbPageTarget): Promise<boolean>;
    /** Delete access of the current identity (trash, delete, cancel-for-delete, D134). */
    canDelete(target: WbPageTarget): Promise<boolean>;
}

/**
 * Website Builder's own page access for the current identity (R47, A25): `wb.page` permissions
 * (incl. own-only) as `GetPageByIdUseCase`, `UpdatePageUseCase` and `TrashPageUseCase` check them,
 * plus folder-level permissions on the page's folder. Evaluated as another user inside
 * `CandidateReadAccess` (R48).
 */
export const WbPageAccess = createAbstraction<IWbPageAccess>("WbPageAccess");

export namespace WbPageAccess {
    export type Interface = IWbPageAccess;
}
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageAccess/WbPageAccess.ts`:

```ts
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import type { WbPageTarget } from "../WbPageTargetReader/abstractions.js";
import { WbPageAccess as Abstraction } from "./abstractions.js";

/**
 * Write and delete include read, because WB loads the page through `GetPageByIdUseCase` before it
 * updates or trashes it (R82). Folder-level permissions as the ACO CMS decorators apply them to
 * page entries, inline in each check, as `CmsEntryAccess` does (R78).
 */
class WbPageAccessImpl implements Abstraction.Interface {
    public constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public canWriteAnyPage(): Promise<boolean> {
        return this.permissions.canEdit("page");
    }

    public canDeleteAnyPage(): Promise<boolean> {
        // Entity-level `canDelete` treats an own-only permission as "no item, no match"; passing
        // the current identity as creator makes any delete permission pass.
        const identity = this.identityContext.getIdentity();
        return this.permissions.canDelete("page", { createdBy: { id: identity.id } });
    }

    public async canRead(target: WbPageTarget): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        if (!(await this.permissions.canAccess("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }

    public async canWrite(target: WbPageTarget): Promise<boolean> {
        if (!(await this.canRead(target))) {
            return false;
        }
        if (!(await this.permissions.canEdit("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "w" });
    }

    public async canDelete(target: WbPageTarget): Promise<boolean> {
        if (!(await this.canRead(target))) {
            return false;
        }
        if (!(await this.permissions.canDelete("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "d" });
    }
}

export const WbPageAccess = Abstraction.createImplementation({
    implementation: WbPageAccessImpl,
    dependencies: [WbPermissions, IdentityContext, FolderLevelPermissions]
});
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageAccess/index.ts`:

```ts
export { WbPageAccess } from "./abstractions.js";
```

- [ ] **Step 6: Register**

Create `packages/api-website-builder-workflows/src/features/target/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WbPageReviewNamespace } from "./WbPageReviewNamespace.js";
import { WbPageTargetReader } from "./WbPageTargetReader/WbPageTargetReader.js";
import { WbPageAccess } from "./WbPageAccess/WbPageAccess.js";

/** The `wb.page` target adapter (spec 9.3). */
export const WbTargetFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Target",
    register(container) {
        // Lets the single CMS handlers cover pages (R51).
        container.register(WbPageReviewNamespace);
        container.register(WbPageTargetReader);
        container.register(WbPageAccess);
    }
});
```

In `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts` import `WbTargetFeature` from `./features/target/feature.js` and replace the comment and registration inside the license gate with:

```ts
        container.register(WebsiteBuilderPageSchemaFactory);

        // The `wb.page` target adapter (spec 9.3).
        WbTargetFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS (incl. the existing `wbPageSystem.test.ts`).
Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): read page review targets and check page access

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
