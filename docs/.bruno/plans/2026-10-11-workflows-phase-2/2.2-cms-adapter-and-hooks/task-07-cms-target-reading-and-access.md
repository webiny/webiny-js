### Task 7: CMS target reading, access checks and review namespace

R47, R51, R65, R66, R72, R77, R78, A25, A28. Three building blocks of the `cms.*` adapter, all evaluated as the current identity:

- `CmsEntryTargetReader` reads a `cms.<modelId>` target revision (model through `GetModelUseCase`, its group through `GetGroupUseCase`, revision through `GetRevisionByIdUseCase`); a model or group the user cannot read, a private model or a missing revision is "no target".
- `CmsEntryAccess` answers read, write and delete access with the CMS's own logic (and `canDeleteAnyEntry(namespace)`, the entity-level delete check the cancel-for-delete wrapper makes before it reads any target or review, R86): group read (`AccessControl.canAccessGroup`), model read (`canAccessModel`), `canAccessEntry({ model, entry, rwd })`, plus folder-level permissions on the entry's folder, as the ACO CMS decorators do. Group and model read are part of the check because `canAccessEntry` ignores them and another user's access (R48) is evaluated without re-reading the model (R72, D61 "model read").
- `CmsEntryReviewNamespace` (resolved `multiple`) maps a CMS model to its review namespace for the single CMS handlers; the CMS registers `CmsModelReviewNamespace` (non-private → `cms.<modelId>`), WB adds `wb.page` in Task 15.

The folder check is a shared helper, `canAccessEntryFolder`, which the Website Builder package reuses for pages (they are CMS entries, R78). Also removes the unused `createWorkflowAppName`, moves `@webiny/api-aco` to `dependencies` and adds the package's `ci.config.json` so CI runs the OpenSearch storage too (R77).

**Files:**
- Modify: `packages/api-headless-cms-workflows/package.json`
- Create: `packages/api-headless-cms-workflows/ci.config.json`
- Modify: `packages/api-headless-cms-workflows/src/utils/appName.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/CmsModelReviewNamespace.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/resolveReviewNamespace.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/CmsEntryTargetReader.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/canAccessEntryFolder.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/identities.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/permissions.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/entries.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeFolderLevelPermissions.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryAccess.test.ts`

**Interfaces:**
- Consumes: `GetModelUseCase`, `GetGroupUseCase` (`@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js`), `GetRevisionByIdUseCase`, `AccessControl` (`@webiny/api-headless-cms/features/shared/abstractions.js`), `FolderLevelPermissions` (`@webiny/api-aco/features/flp/FolderLevelPermissions/index.js`), `ROOT_FOLDER` (`@webiny/api-headless-cms/constants.js`), `CmsModel`, `CmsGroup`, `CmsEntry`.
- Produces:
  - `utils/appName.ts`: `toCmsNamespace(modelId): string`, `getModelIdFromAppName(app): string | null` (kept), `isCmsNamespace(app): boolean`, `getCmsNamespace(model: Pick<CmsModel, "modelId" | "isPrivate">): string | null`.
  - `EntryFolderRwd = "r" | "w" | "d"`, `canAccessEntryFolder(flp: FolderLevelPermissions.Interface, folderId: string | null | undefined, rwd: EntryFolderRwd): Promise<boolean>` (`features/target/canAccessEntryFolder.ts`; also used by the WB package).
  - `CmsEntryReviewNamespace.Interface { resolve(model: CmsModel): string | null }`; `resolveReviewNamespace(namespaces: CmsEntryReviewNamespace.Interface[], model: CmsModel): string | null` (last non-null wins).
  - `CmsEntryTarget { model: CmsModel; group: CmsGroup; entry: CmsEntry }`, `CmsEntryTargetReadParams { model: string; targetRevisionId: string }`, `CmsEntryTargetReader.Interface { read(params): Promise<CmsEntryTarget | null> }` (namespace types `CmsEntryTargetReader.Target`, `.Params`; the barrel exports only the abstraction).
  - `CmsEntryAccess.Interface { canRead(target: CmsEntryTarget): Promise<boolean>; canWrite(target: CmsEntryTarget): Promise<boolean>; canDelete(target: CmsEntryTarget): Promise<boolean>; canDeleteAnyEntry(namespace: string): Promise<boolean> }`.
  - `CmsTargetFeature` registers the three implementations; Task 8 adds the adapter ports to it.
  - Test helpers: identities (`ADMIN`, `REQUESTER`, `REVIEWER`, `OTHER_REVIEWER`, `READER`, `WRITER`, `REASSIGNER`, `EDITOR`, `NOBODY`), permission sets (`CMS_READER`, `CMS_WRITER`, `CMS_DELETER`, `CMS_OWN_WRITER`, `CMS_ENTRY_READER_WITHOUT_MODEL`), `createAuthorEntry`, `getAuthorModel`, `expectOk`, `FakeFolderLevelPermissions` + `folderLevels`.

- [ ] **Step 1: Write the test helpers and the failing test**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/identities.ts`:

```ts
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

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

/**
 * A request identity of type `api-key` with embedded permissions, as `TestAuthorizer` serves it.
 * Only for target-access unit tests; the wrapper tests use a real stored API key (R79).
 */
export const createApiKeyIdentity = (permissions: SecurityPermission[]): IdentityData => {
    return { id: "api-key-1", type: "api-key", displayName: "CI key", permissions };
};

/** The team of the test workflow's only step. */
export const REVIEW_TEAM = "team-1";

export const toActor = (identity: IdentityData): Actor => {
    return {
        type: "user",
        id: identity.id,
        displayName: identity.displayName,
        identityType: identity.type
    };
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/permissions.ts`:

```ts
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const GROUP_READ: SecurityPermission = { name: "cms.contentModelGroup", rwd: "r" };
const MODEL_READ: SecurityPermission = { name: "cms.contentModel", rwd: "r" };

/** Reads every CMS entry; cannot change any. */
export const CMS_READER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "r" }
];

/** Reads and writes every CMS entry. */
export const CMS_WRITER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rw" }
];

/** Reads, writes and deletes every CMS entry (may trash and delete content, D134). */
export const CMS_DELETER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rwd" }
];

/** Entry read without model read: `canAccessEntry` alone would allow it (R72). */
export const CMS_ENTRY_READER_WITHOUT_MODEL: SecurityPermission[] = [
    GROUP_READ,
    { name: "cms.contentEntry", rwd: "r" }
];

/** Reads and writes only the entries the identity created. */
export const CMS_OWN_WRITER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rw", own: true }
];

export const WORKFLOWS_EDITOR: SecurityPermission = { name: "workflows", editor: true };
export const WORKFLOWS_REASSIGN: SecurityPermission = { name: "workflows", reassign: true };
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/entries.ts`:

```ts
import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { model } from "~tests/__cms/models.js";

/** The review namespace of the test model. */
export const AUTHOR_NAMESPACE = `cms.${model.modelId}`;

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export const getAuthorModel = async (context: CmsContext): Promise<CmsModel> => {
    return expectOk(await context.container.resolve(GetModelUseCase).execute(model.modelId));
};

export interface AuthorEntryParams {
    name: string;
    /** Defaults to the root folder. */
    folderId?: string;
}

/** Creates an "author" entry as the context's identity. */
export const createAuthorEntry = async (
    context: CmsContext,
    params: AuthorEntryParams
): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(authorModel, {
            values: { name: params.name },
            location: { folderId: params.folderId ?? "root" }
        })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeFolderLevelPermissions.ts`:

```ts
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import {
    CanAccessFolderContent,
    type CanAccessFolderContentParams
} from "@webiny/api-aco/features/flp/FolderLevelPermissions/useCases/index.js";
import type { FolderAccessLevel, FolderPermission } from "@webiny/api-aco/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Folder id → user id → access level. Folders not listed give the current identity `owner`.
 * Reset it in `afterEach`.
 */
export const folderLevels = new Map<string, Map<string, FolderAccessLevel>>();

/** One entry of `IFolderLevelPermissions.listFolderLevelPermissions` (structurally identical). */
interface FolderPermissionsListItem {
    id: string;
    permissions: FolderPermission[];
}

/**
 * FLP that is on for admin identities (like the real one) and decides with the real ACO
 * `CanAccessFolderContent`; folder permissions come from `folderLevels` (A28).
 */
class FakeFolderLevelPermissionsImpl implements FolderLevelPermissions.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public canUseFolderLevelPermissions(enabled?: boolean): boolean {
        if (enabled === false) {
            return false;
        }
        return this.identityContext.getIdentity().type === "admin";
    }

    public canUseTeams(): boolean {
        return false;
    }

    public canCreateFolderInRoot(): boolean {
        return true;
    }

    public permissionsIncludeNonInheritedPermissions(): boolean {
        return false;
    }

    public async canAccessFolder(): Promise<boolean> {
        return true;
    }

    public async canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean> {
        return new CanAccessFolderContent(this.identityContext).execute(params);
    }

    public async ensureCanAccessFolder(): Promise<void> {
        return;
    }

    public async ensureCanAccessFolderContent(): Promise<void> {
        return;
    }

    public async canManageFolderContent(): Promise<boolean> {
        return true;
    }

    public async canManageFolderStructure(): Promise<boolean> {
        return true;
    }

    public async canManageFolderPermissions(): Promise<boolean> {
        return true;
    }

    public async getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]> {
        return permissions;
    }

    public async listFolderLevelPermissions(): Promise<FolderPermissionsListItem[]> {
        return [];
    }

    public async getFolderLevelPermissions(id: string): Promise<FolderPermission[]> {
        const levels = folderLevels.get(id);
        if (!levels) {
            const identity = this.identityContext.getIdentity();
            return [{ target: `admin:${identity.id}`, level: "owner" }];
        }
        return [...levels.entries()].map(([userId, level]) => {
            return { target: `admin:${userId}`, level };
        });
    }
}

export const FakeFolderLevelPermissions = FolderLevelPermissions.createImplementation({
    implementation: FakeFolderLevelPermissionsImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryAccess.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import {
    CMS_DELETER,
    CMS_OWN_WRITER,
    CMS_READER,
    CMS_WRITER
} from "~tests/__helpers/permissions.js";
import { createApiKeyIdentity, NOBODY, READER, WRITER } from "~tests/__helpers/identities.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import {
    CmsEntryReviewNamespace,
    resolveReviewNamespace
} from "~/features/target/CmsEntryReviewNamespace/index.js";

const registerFakeFlp = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
};

interface UserContextParams {
    identity?: IdentityData;
    permissions?: SecurityPermission[];
}

const createUserContext = async (params: UserContextParams = {}) => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        legacyPlugins: [registerFakeFlp]
    });
    return context();
};

const createAccess = async (params: UserContextParams) => {
    const context = await createUserContext(params);
    return {
        targets: context.container.resolve(CmsEntryTargetReader),
        access: context.container.resolve(CmsEntryAccess)
    };
};

describe("CMS target reading and access", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("reads a CMS revision and lets a reader read but not write it", async () => {
        const entry = await createAuthorEntry(await createUserContext(), { name: "Ann" });
        const { targets, access } = await createAccess({
            identity: READER,
            permissions: CMS_READER
        });

        const target = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(target?.model.modelId).toBe("author");
        expect(target?.entry.id).toBe(entry.id);
        expect(await access.canRead(target!)).toBe(true);
        expect(await access.canWrite(target!)).toBe(false);
    });

    it("lets a writer write and only a deleter delete", async () => {
        const entry = await createAuthorEntry(await createUserContext(), { name: "Ann" });
        const writer = await createAccess({ identity: WRITER, permissions: CMS_WRITER });
        const deleter = await createAccess({ identity: WRITER, permissions: CMS_DELETER });

        const writerTarget = await writer.targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });
        const deleterTarget = await deleter.targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(writerTarget?.group.id).toBe(writerTarget?.model.group);
        expect(await writer.access.canWrite(writerTarget!)).toBe(true);
        expect(await writer.access.canDelete(writerTarget!)).toBe(false);
        expect(await deleter.access.canDelete(deleterTarget!)).toBe(true);
    });

    it("answers the entity-level delete check by namespace (R86)", async () => {
        const writer = await createAccess({ identity: WRITER, permissions: CMS_WRITER });
        const deleter = await createAccess({ identity: WRITER, permissions: CMS_DELETER });
        const nobody = await createAccess({ identity: NOBODY, permissions: [] });

        expect(await deleter.access.canDeleteAnyEntry(AUTHOR_NAMESPACE)).toBe(true);
        expect(await writer.access.canDeleteAnyEntry(AUTHOR_NAMESPACE)).toBe(false);
        expect(await nobody.access.canDeleteAnyEntry(AUTHOR_NAMESPACE)).toBe(false);
        expect(await deleter.access.canDeleteAnyEntry("wb.page")).toBe(false);
        expect(await deleter.access.canDeleteAnyEntry("cms.missing")).toBe(false);
    });

    it("finds no target for a user without access to the model", async () => {
        const entry = await createAuthorEntry(await createUserContext(), { name: "Ann" });
        const { targets } = await createAccess({ identity: NOBODY, permissions: [] });

        const target = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(target).toBeNull();
    });

    it("finds no target for a missing revision or another app's namespace", async () => {
        const entry = await createAuthorEntry(await createUserContext(), { name: "Ann" });
        const { targets } = await createAccess({});

        const missing = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: `${entry.entryId}#0009`
        });
        const otherApp = await targets.read({ model: "wb.page", targetRevisionId: entry.id });

        expect(missing).toBeNull();
        expect(otherApp).toBeNull();
    });

    it("honours own-only entry permissions", async () => {
        const writerContext = await createUserContext({
            identity: WRITER,
            permissions: CMS_WRITER
        });
        const entry = await createAuthorEntry(writerContext, { name: "Own entry" });
        const owner = await createAccess({ identity: WRITER, permissions: CMS_OWN_WRITER });
        const other = await createAccess({ identity: READER, permissions: CMS_OWN_WRITER });

        const ownerTarget = await owner.targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });
        const otherTarget = await other.targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(await owner.access.canWrite(ownerTarget!)).toBe(true);
        expect(await other.access.canRead(otherTarget!)).toBe(false);
        expect(await other.access.canWrite(otherTarget!)).toBe(false);
    });

    it("applies folder-level permissions to read and write", async () => {
        const admin = await createUserContext();
        const locked = await createAuthorEntry(admin, { name: "Locked", folderId: "folder-locked" });
        const viewed = await createAuthorEntry(admin, { name: "Viewed", folderId: "folder-viewed" });
        folderLevels.set("folder-locked", new Map([[WRITER.id, "no-access"]]));
        folderLevels.set("folder-viewed", new Map([[WRITER.id, "viewer"]]));
        const { targets, access } = await createAccess({
            identity: WRITER,
            permissions: CMS_DELETER
        });

        const lockedTarget = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: locked.id
        });
        const viewedTarget = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: viewed.id
        });

        expect(await access.canRead(lockedTarget!)).toBe(false);
        expect(await access.canRead(viewedTarget!)).toBe(true);
        expect(await access.canWrite(viewedTarget!)).toBe(false);
        expect(await access.canDelete(viewedTarget!)).toBe(false);
    });

    it("does not apply folder-level permissions to API keys", async () => {
        const entry = await createAuthorEntry(await createUserContext(), {
            name: "Locked",
            folderId: "folder-locked"
        });
        folderLevels.set("folder-locked", new Map([["api-key-1", "no-access"]]));
        const { targets, access } = await createAccess({
            identity: createApiKeyIdentity(CMS_READER),
            permissions: []
        });

        const target = await targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(await access.canRead(target!)).toBe(true);
    });

    it("resolves the review namespace of public models only (R51)", async () => {
        const context = await createUserContext();
        const namespaces = context.container.resolveAll(CmsEntryReviewNamespace);
        const reviewModel = expectOk(
            await context.container.resolve(GetModelUseCase).execute("wbyWorkflowReview")
        );

        expect(resolveReviewNamespace(namespaces, await getAuthorModel(context))).toBe(
            AUTHOR_NAMESPACE
        );
        // The workflows' own private models (and WB pages without the WB package) have none.
        expect(resolveReviewNamespace(namespaces, reviewModel)).toBeNull();
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryAccess.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/target/CmsEntryTargetReader/index.js`.

- [ ] **Step 3: Namespaces, CI storages and the dependency**

In `packages/api-headless-cms-workflows/package.json` move `"@webiny/api-aco": "0.0.0"` from `devDependencies` to `dependencies` (alphabetical, before `@webiny/api-core`).

Create `packages/api-headless-cms-workflows/ci.config.json` (same format as `packages/api-workflows/ci.config.json`; workflows assume OpenSearch, D63, R77):

```json
{
  "$schema": "../../.github/workflows/ci.config.schema.json",
  "vitest": {
    "storageOps": ["ddb", "ddb-os,ddb"]
  }
}
```

Replace `packages/api-headless-cms-workflows/src/utils/appName.ts` with:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

const CMS_NAMESPACE = /^cms\.([a-zA-Z0-9_-]+)$/;

/** The review namespace of a CMS model id, e.g. "cms.article" (D15). */
export const toCmsNamespace = (modelId: string): string => {
    return `cms.${modelId}`;
};

/** The model id of a `cms.<modelId>` namespace; `null` for any other namespace. */
export const getModelIdFromAppName = (app: string): string | null => {
    const matched = app.match(CMS_NAMESPACE);
    return matched ? matched[1] : null;
};

export const isCmsNamespace = (app: string): boolean => {
    return getModelIdFromAppName(app) !== null;
};

/**
 * The review namespace of a CMS model's entries: `cms.<modelId>` for public models, `null` for
 * private ones (Website Builder pages, the workflows' own models), R51, R52.
 */
export const getCmsNamespace = (model: Pick<CmsModel, "modelId" | "isPrivate">): string | null => {
    return model.isPrivate ? null : toCmsNamespace(model.modelId);
};
```

(`createWorkflowAppName` had no importer; confirm with `grep -rn "createWorkflowAppName" packages/*/src` before saving.)

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryReviewNamespace {
    /**
     * The review namespace of this model's entries (e.g. "cms.article", "wb.page"), or `null`
     * when this implementation does not own the model.
     */
    resolve(model: CmsModel): string | null;
}

/**
 * Maps a CMS model to the review namespace of its entries, for the single CMS entry handlers that
 * also cover apps built on CMS entries (D59, R51). Resolved `multiple`; the last registered
 * non-null answer wins. A model with no namespace is skipped by every handler.
 */
export const CmsEntryReviewNamespace =
    createAbstraction<ICmsEntryReviewNamespace>("CmsEntryReviewNamespace");

export namespace CmsEntryReviewNamespace {
    export type Interface = ICmsEntryReviewNamespace;
}
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/CmsModelReviewNamespace.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { CmsEntryReviewNamespace } from "./abstractions.js";

/** Public CMS models review under `cms.<modelId>`; private models are left to their app (R51). */
class CmsModelReviewNamespaceImpl implements CmsEntryReviewNamespace.Interface {
    public resolve(model: CmsModel): string | null {
        return getCmsNamespace(model);
    }
}

export const CmsModelReviewNamespace = CmsEntryReviewNamespace.createImplementation({
    implementation: CmsModelReviewNamespaceImpl,
    dependencies: []
});
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/resolveReviewNamespace.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryReviewNamespace } from "./abstractions.js";

/** The last registered non-null namespace for the model, or `null` (R51). */
export const resolveReviewNamespace = (
    namespaces: CmsEntryReviewNamespace.Interface[],
    model: CmsModel
): string | null => {
    for (const namespace of [...namespaces].reverse()) {
        const resolved = namespace.resolve(model);
        if (resolved) {
            return resolved;
        }
    }
    return null;
};
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewNamespace/index.ts`:

```ts
export { CmsEntryReviewNamespace } from "./abstractions.js";
export { resolveReviewNamespace } from "./resolveReviewNamespace.js";
```

(The WB package registers an implementation and its tests resolve namespaces, so both are exported.)

- [ ] **Step 4: Target reader and access**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface CmsEntryTargetReadParams {
    /** Namespace id, e.g. "cms.article". */
    model: string;
    targetRevisionId: string;
}

export interface CmsEntryTarget {
    model: CmsModel;
    /** The model's group, read as the current identity; group read is part of entry access (R72). */
    group: CmsGroup;
    entry: CmsEntry;
}

export interface ICmsEntryTargetReader {
    /**
     * Reads the revision as the current identity. `null` when the namespace is not `cms.*`, the
     * model or its group does not exist or cannot be read, the model is private, or the revision
     * does not exist (a trashed revision reads as missing). Other failures are thrown.
     */
    read(params: CmsEntryTargetReadParams): Promise<CmsEntryTarget | null>;
}

/** Loads a CMS target revision for the `cms.*` adapter and wrappers (R47). */
export const CmsEntryTargetReader = createAbstraction<ICmsEntryTargetReader>("CmsEntryTargetReader");

export namespace CmsEntryTargetReader {
    export type Interface = ICmsEntryTargetReader;
    export type Params = CmsEntryTargetReadParams;
    export type Target = CmsEntryTarget;
}
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/CmsEntryTargetReader.ts`:

```ts
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { CmsEntryTargetReader as Abstraction } from "./abstractions.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";
const GROUP_NOT_FOUND = "Cms/ModelGroup/NotFound";
const GROUP_NOT_AUTHORIZED = "Cms/ModelGroup/NotAuthorized";
const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

/**
 * The model is read through the access-controlled `GetModelUseCase` as the current identity: a
 * model the user cannot read is no target for them, and nothing fills the tenant-keyed model cache
 * without access filtering (A19). The group is read the same way, so `CmsEntryAccess` can check
 * group read for another user without reading anything as them. The revision itself is read
 * without entry checks; callers decide access with `CmsEntryAccess`.
 */
class CmsEntryTargetReaderImpl implements Abstraction.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface
    ) {}

    public async read(params: Abstraction.Params): Promise<Abstraction.Target | null> {
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            return null;
        }

        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (model.error.code === MODEL_NOT_FOUND || model.error.code === MODEL_NOT_AUTHORIZED) {
                return null;
            }
            throw model.error;
        }
        if (model.value.isPrivate) {
            return null;
        }

        const group = await this.getGroup.execute(model.value.group);
        if (group.isFail()) {
            if (group.error.code === GROUP_NOT_FOUND || group.error.code === GROUP_NOT_AUTHORIZED) {
                return null;
            }
            throw group.error;
        }

        const entry = await this.getRevisionById.execute(model.value, params.targetRevisionId);
        if (entry.isFail()) {
            if (entry.error.code === ENTRY_NOT_FOUND) {
                return null;
            }
            throw entry.error;
        }

        return { model: model.value, group: group.value, entry: entry.value };
    }
}

export const CmsEntryTargetReader = Abstraction.createImplementation({
    implementation: CmsEntryTargetReaderImpl,
    dependencies: [GetModelUseCase, GetGroupUseCase, GetRevisionByIdUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryTargetReader/index.ts`:

```ts
export { CmsEntryTargetReader } from "./abstractions.js";
```

(Consumers use the namespace types `CmsEntryTargetReader.Target` / `.Params`.)

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";

export interface ICmsEntryAccess {
    /** Read access of the current identity (review actions, get review). */
    canRead(target: CmsEntryTarget): Promise<boolean>;
    /** Write access of the current identity (request a review, D77). */
    canWrite(target: CmsEntryTarget): Promise<boolean>;
    /** Delete access of the current identity (trash or delete, cancel-for-delete, D134). */
    canDelete(target: CmsEntryTarget): Promise<boolean>;
    /**
     * Entity-level delete permission for a `cms.*` namespace, as `DeleteEntryUseCase` checks it
     * before it loads an entry (`canAccessEntry({ model, rwd: "d" })`), plus group and model read.
     * `false` for another app's namespace, a private, missing or unreadable model or group. Lets
     * the cancel-for-delete wrapper refuse before it reads anything (R86).
     */
    canDeleteAnyEntry(namespace: string): Promise<boolean>;
}

/**
 * The CMS's own entry access logic for the current identity (R47, R72): group read, model read
 * and entry permissions (incl. own-only) through `AccessControl`, plus folder-level permissions on
 * the entry's folder. Evaluated as another user inside `CandidateReadAccess` for `canUserRead`
 * (R48).
 */
export const CmsEntryAccess = createAbstraction<ICmsEntryAccess>("CmsEntryAccess");

export namespace CmsEntryAccess {
    export type Interface = ICmsEntryAccess;
}
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`:

```ts
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";
import { canAccessEntryFolder, type EntryFolderRwd } from "../canAccessEntryFolder.js";
import { CmsEntryAccess as Abstraction } from "./abstractions.js";

const UNREADABLE_CODES = [
    "Cms/Model/NotFound",
    "Cms/Model/NotAuthorized",
    "Cms/ModelGroup/NotFound",
    "Cms/ModelGroup/NotAuthorized"
];

/**
 * Group and model read first (what `GetModelUseCase` and the group cache enforce for the current
 * identity), then the entry permission, then FLP as `GetEntryByIdWithFlpDecorator`,
 * `UpdateEntryWithFlpDecorator` and `DeleteEntryWithFlpDecorator` (api-aco) apply it.
 */
class CmsEntryAccessImpl implements Abstraction.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public canRead(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "r");
    }

    public canWrite(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "w");
    }

    public canDelete(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "d");
    }

    public async canDeleteAnyEntry(namespace: string): Promise<boolean> {
        const modelId = getModelIdFromAppName(namespace);
        if (!modelId) {
            return false;
        }
        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (UNREADABLE_CODES.includes(model.error.code)) {
                return false;
            }
            throw model.error;
        }
        if (model.value.isPrivate) {
            return false;
        }
        const group = await this.getGroup.execute(model.value.group);
        if (group.isFail()) {
            if (UNREADABLE_CODES.includes(group.error.code)) {
                return false;
            }
            throw group.error;
        }
        if (!(await this.accessControl.canAccessGroup({ group: group.value }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: model.value }))) {
            return false;
        }
        return this.accessControl.canAccessEntry({ model: model.value, rwd: "d" });
    }

    private async can(target: CmsEntryTarget, rwd: EntryFolderRwd): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: target.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: target.model }))) {
            return false;
        }
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model: target.model,
            entry: target.entry,
            rwd
        });
        if (!canAccessEntry) {
            return false;
        }
        return canAccessEntryFolder(
            this.folderLevelPermissions,
            target.entry.location?.folderId,
            rwd
        );
    }
}

export const CmsEntryAccess = Abstraction.createImplementation({
    implementation: CmsEntryAccessImpl,
    dependencies: [AccessControl, GetModelUseCase, GetGroupUseCase, FolderLevelPermissions]
});
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/index.ts`:

```ts
export { CmsEntryAccess } from "./abstractions.js";
```

Create `packages/api-headless-cms-workflows/src/features/target/canAccessEntryFolder.ts`:

```ts
import type { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";

export type EntryFolderRwd = "r" | "w" | "d";

/**
 * Folder-level permissions on a CMS entry's folder for the current identity, as the ACO CMS
 * decorators apply them: skipped when FLP is not in use for the identity (e.g. API keys) or the
 * entry is in the root folder. Shared with the Website Builder adapter, whose pages are CMS
 * entries (R78).
 */
export const canAccessEntryFolder = async (
    folderLevelPermissions: FolderLevelPermissions.Interface,
    folderId: string | null | undefined,
    rwd: EntryFolderRwd
): Promise<boolean> => {
    if (!folderLevelPermissions.canUseFolderLevelPermissions()) {
        return true;
    }
    if (!folderId || folderId === ROOT_FOLDER) {
        return true;
    }
    const permissions = await folderLevelPermissions.getFolderLevelPermissions(folderId);
    return folderLevelPermissions.canAccessFolderContent({ permissions, rwd });
};
```

- [ ] **Step 5: Register**

Create `packages/api-headless-cms-workflows/src/features/target/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsModelReviewNamespace } from "./CmsEntryReviewNamespace/CmsModelReviewNamespace.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/CmsEntryTargetReader.js";
import { CmsEntryAccess } from "./CmsEntryAccess/CmsEntryAccess.js";

/** The `cms.*` target adapter (spec 9.3). */
export const CmsTargetFeature = createFeature({
    name: "CmsWorkflows/Target",
    register(container) {
        container.register(CmsModelReviewNamespace);
        container.register(CmsEntryTargetReader);
        container.register(CmsEntryAccess);
    }
});
```

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` import `CmsTargetFeature` from `./features/target/feature.js` and replace the comment block and call inside the license gate (from `// Entry handlers (system.workflow sync...` through `CmsLocalWorkflowsFeature.register(container);`) with:

```ts
        // Bindable-model checks on the engine's workflow before-save events.
        CmsLocalWorkflowsFeature.register(container);

        // The `cms.*` target adapter (spec 9.3).
        CmsTargetFeature.register(container);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): read CMS review targets and check entry access

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
