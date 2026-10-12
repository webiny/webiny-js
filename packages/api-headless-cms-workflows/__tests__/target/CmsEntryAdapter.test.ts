import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import {
    cancelEntryReview,
    readEntry,
    requestEntryReview,
    STEP_ID
} from "~tests/__helpers/engine.js";
import {
    ADMIN,
    NOBODY,
    READER,
    REVIEW_TEAM,
    REVIEWER,
    toActor,
    WRITER
} from "~tests/__helpers/identities.js";
import { CMS_ENTRY_READER_WITHOUT_MODEL, CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";

/** Admin users of the tenant; "user-elsewhere" has CMS read access but is not one of them. */
const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.registerInstance(
        GetUserUseCase,
        new FakeAdminUsers([READER.id, NOBODY.id, WRITER.id])
    );
};

const createAdminContext = async () => {
    const { context } = createContextHandler({
        legacyPlugins: [registerFakes],
        permissionsByIdentity: {
            [READER.id]: CMS_READER,
            [WRITER.id]: CMS_ENTRY_READER_WITHOUT_MODEL,
            "user-elsewhere": CMS_READER
        }
    });
    return context();
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle(AUTHOR_NAMESPACE))!;
};

describe("CMS target adapter", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("loads a CMS revision's title and typed context", async () => {
        const context = await createAdminContext();
        const inFolder = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const inRoot = await createAuthorEntry(context, { name: "Bob" });
        const loaders = context.container.resolveAll(ReviewTargetLoader);
        const loader = loaders.find(item => item.canLoad(AUTHOR_NAMESPACE))!;

        const loaded = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: inFolder.entryId,
            targetRevisionId: inFolder.id
        });
        const rootLoaded = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: inRoot.entryId,
            targetRevisionId: inRoot.id
        });

        expect(loaded).toEqual({
            title: "Ann",
            context: {
                folder: { id: "folder-1", type: "cms:author" },
                modelId: "author",
                title: "Ann",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        });
        expect(rootLoaded?.context.folder).toBeNull();
        expect(loaders.some(item => item.canLoad("wb.page"))).toBe(false);
    });

    it("loads nothing for a missing revision or a revision of another entry", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const loader = context.container
            .resolveAll(ReviewTargetLoader)
            .find(item => item.canLoad(AUTHOR_NAMESPACE))!;

        const missing = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });
        const mismatched = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: "another-entry",
            targetRevisionId: entry.id
        });

        expect(missing).toBeNull();
        expect(mismatched).toBeNull();
    });

    it("writes system.workflow on request and clears it on cancel", async () => {
        const context = await createAdminContext();
        expectOk(await storeWorkflow(context));
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const review = await requestEntryReview(context, entry);
        const requested = await readEntry(context, entry.id);
        await cancelEntryReview(context, review);
        const cancelled = await readEntry(context, entry.id);

        expect(requested.system?.workflow).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
        expect(cancelled.system?.workflow).toBeNull();
        expect(
            context.container.resolveAll(ReviewTargetSync).some(item => item.canSync("wb.page"))
        ).toBe(false);
    });

    it("syncs a transition made by a reviewer who can only read the entry (R63)", async () => {
        const admin = await createAdminContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const review = await requestEntryReview(admin, entry);
        const { context } = createContextHandler({ identity: REVIEWER, permissions: CMS_READER });
        const reviewerContext = await context();

        const started = await reviewerContext.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM]
        });

        expect(started.isOk()).toBe(true);
        expect((await readEntry(admin, entry.id)).system?.workflow?.stepState).toBe("inReview");
    });

    it("answers read access for another user with that user's permissions (R48)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const access = getReadAccess(context);
        const params = {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        };

        const reader = await access.canUserRead({ ...params, userId: READER.id });
        const nobody = await access.canUserRead({ ...params, userId: NOBODY.id });
        folderLevels.set("folder-1", new Map([[READER.id, "no-access"]]));
        const readerWithoutFolder = await access.canUserRead({ ...params, userId: READER.id });

        expect(reader).toBe(true);
        expect(nobody).toBe(false);
        expect(readerWithoutFolder).toBe(false);
        // The request identity and its permissions are untouched afterwards.
        expect(context.container.resolve(IdentityContext).getIdentity().id).toBe(ADMIN.id);
        expect(await createAuthorEntry(context, { name: "Still admin" })).toBeTruthy();
    });

    it("denies another user with entry permission but without model read (R72)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const canRead = await getReadAccess(context).canUserRead({
            userId: WRITER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(canRead).toBe(false);
    });

    it("denies a user who is not an admin user of the current tenant (R68)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const canRead = await getReadAccess(context).canUserRead({
            userId: "user-elsewhere",
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(canRead).toBe(false);
    });

    it("answers with the user's permissions inside withoutAuthorization (R67)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const params = {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        };
        const identityContext = context.container.resolve(IdentityContext);

        const results = await identityContext.withoutAuthorization(async () => {
            const access = getReadAccess(context);
            return {
                reader: await access.canUserRead({ ...params, userId: READER.id }),
                nobody: await access.canUserRead({ ...params, userId: NOBODY.id })
            };
        });

        expect(results).toEqual({ reader: true, nobody: false });
    });

    it("denies read access to a missing target or another app's namespace", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const accesses = context.container.resolveAll(ReviewTargetReadAccess);
        const access = getReadAccess(context);

        const missing = await access.canUserRead({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });

        expect(missing).toBe(false);
        expect(accesses.some(item => item.canHandle("wb.page"))).toBe(false);
    });
});
