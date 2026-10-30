import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { CmsContext, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
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
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { canUserRead } from "~tests/__helpers/userReadChecks.js";
import { FakeGetFlp } from "~tests/__helpers/FakeGetFlp.js";

class ThrowingUpdateEntrySystem implements UpdateEntrySystemUseCase.Interface {
    public constructor(private decoratee: UpdateEntrySystemUseCase.Interface) {}

    public async execute<
        T extends CmsEntryValues = CmsEntryValues
    >(): UpdateEntrySystemUseCase.Return<T> {
        throw new Error("Storage is down.");
    }
}

class ThrowingTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(): Promise<CmsEntryTargetReader.Target | null> {
        throw new Error("Storage is down.");
    }

    public async readMany(): Promise<CmsEntryTargetReader.Target[]> {
        throw new Error("Storage is down.");
    }
}

const ThrowingTargetReaderDecorator = CmsEntryTargetReader.createDecorator({
    decorator: ThrowingTargetReader,
    dependencies: []
});

const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
};

const createAdminContext = async () => {
    const { context } = createContextHandler({
        legacyPlugins: [registerFakes],
        permissionsByIdentity: {
            [READER.id]: CMS_READER,
            [WRITER.id]: CMS_ENTRY_READER_WITHOUT_MODEL
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

    it("returns a failed result when the system write throws", async () => {
        const { context } = createContextHandler({
            legacyPlugins: [
                registerFakes,
                (container: Container) => {
                    container.registerDecorator(
                        UpdateEntrySystemUseCase.createDecorator({
                            decorator: ThrowingUpdateEntrySystem,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const admin = await createAdminContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const review = await requestEntryReview(admin, entry);
        const ctx = await context();
        const sync = ctx.container
            .resolveAll(ReviewTargetSync)
            .find(item => item.canSync(AUTHOR_NAMESPACE))!;

        const synced = await sync.sync({ review, systemWorkflow: null });

        expect(synced.isFail()).toBe(true);
        expect(synced.error.message).toBe("Storage is down.");
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

        const reader = await canUserRead(access, { ...params, userId: READER.id });
        const nobody = await canUserRead(access, { ...params, userId: NOBODY.id });
        folderLevels.set("folder-1", new Map([[READER.id, "no-access"]]));
        const readerWithoutFolder = await canUserRead(access, { ...params, userId: READER.id });

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

        const canRead = await canUserRead(getReadAccess(context), {
            userId: WRITER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(canRead).toBe(false);
    });

    it("answers with the user's permissions, not a less privileged caller's (R48, R67)", async () => {
        const admin = await createAdminContext();
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const params = {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        };
        // The engine asks as the request identity (here a reader), never from inside
        // withoutAuthorization: the model and group are read as that caller.
        const { context } = createContextHandler({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: [registerFakes],
            permissionsByIdentity: { [READER.id]: CMS_READER }
        });
        const readerContext = await context();
        const access = getReadAccess(readerContext);

        const reader = await canUserRead(access, { ...params, userId: READER.id });
        const nobody = await canUserRead(access, { ...params, userId: NOBODY.id });

        expect({ reader, nobody }).toEqual({ reader: true, nobody: false });
        expect(readerContext.container.resolve(IdentityContext).getIdentity().id).toBe(READER.id);
    });

    it("denies read access when reading the target throws (R50)", async () => {
        const { context } = createContextHandler({
            legacyPlugins: [
                registerFakes,
                (container: Container) => {
                    container.registerDecorator(ThrowingTargetReaderDecorator);
                }
            ],
            permissionsByIdentity: { [READER.id]: CMS_READER }
        });
        const ctx = await context();
        const entry = await createAuthorEntry(ctx, { name: "Ann" });

        const canRead = await canUserRead(getReadAccess(ctx), {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(canRead).toBe(false);
    });

    it("denies read access to a missing target or another app's namespace", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const accesses = context.container.resolveAll(ReviewTargetReadAccess);
        const access = getReadAccess(context);

        const missing = await canUserRead(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });

        expect(missing).toBe(false);
        expect(accesses.some(item => item.canHandle("wb.page"))).toBe(false);
    });
});
