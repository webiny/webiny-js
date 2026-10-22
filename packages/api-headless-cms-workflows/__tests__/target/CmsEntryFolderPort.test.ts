import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { createWorkflowValuesWithAssignment, storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { NOBODY, READER, REVIEW_TEAM, REVIEWER, WRITER } from "~tests/__helpers/identities.js";
import {
    CMS_ENTRY_READER_WITHOUT_MODEL,
    CMS_READER,
    CMS_READER_WITHOUT_GROUP_READ
} from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { addTestFolder, failingFolderReads, testFolders } from "~tests/__helpers/FakeFolders.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";
import { canUserReadInFolder } from "~tests/__helpers/userReadChecks.js";
import { FakeGetFlp } from "~tests/__helpers/FakeGetFlp.js";

const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
};

/** Has model and entry read, but the group permission lacks read. */
const NO_GROUP_READER_ID = "user-no-group-read";

/** The default admin (`*`) with the extra code models, the fake FLP and throwing access checks. */
const createAdminContext = async (): Promise<CmsContext> => {
    const { context } = createContextHandler({
        legacyPlugins: [...createExtraModelPlugins(), registerFakes, throwOnAccessChecks],
        permissionsByIdentity: {
            [READER.id]: CMS_READER,
            [WRITER.id]: CMS_ENTRY_READER_WITHOUT_MODEL,
            [NO_GROUP_READER_ID]: CMS_READER_WITHOUT_GROUP_READ
        }
    });
    return context();
};

const getFolderChain = (context: CmsContext): ReviewTargetFolderChain.Interface => {
    return context.container
        .resolveAll(ReviewTargetFolderChain)
        .find(item => item.canHandle(AUTHOR_NAMESPACE))!;
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle(AUTHOR_NAMESPACE))!;
};

const folderExists = (context: CmsContext, id: string, type: string) => {
    return context.container.resolve(CmsEntryFolderExistsService).exists({ id, type });
};

/** "folder-parent" > "folder-child" > "folder-grandchild", and "folder-sibling", all "author". */
const addAuthorFolders = () => {
    addTestFolder({ id: "folder-parent", type: "cms:author" });
    addTestFolder({ id: "folder-child", type: "cms:author", parentId: "folder-parent" });
    addTestFolder({ id: "folder-grandchild", type: "cms:author", parentId: "folder-child" });
    addTestFolder({ id: "folder-sibling", type: "cms:author" });
};

describe("CMS folder port", () => {
    afterEach(() => {
        testFolders.clear();
        failingFolderReads.clear();
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists a folder and its ancestors, nearest first (R114)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        const chain = getFolderChain(context);

        const nested = await chain.listFolderChainIds({
            model: AUTHOR_NAMESPACE,
            folderId: "folder-grandchild"
        });
        const topLevel = await chain.listFolderChainIds({
            model: AUTHOR_NAMESPACE,
            folderId: "folder-parent"
        });

        expect(nested).toEqual(["folder-grandchild", "folder-child", "folder-parent"]);
        expect(topLevel).toEqual(["folder-parent"]);
    });

    it("answers only for cms namespaces", async () => {
        const context = await createAdminContext();
        const chains = context.container.resolveAll(ReviewTargetFolderChain);

        expect(chains.some(item => item.canHandle("cms.author"))).toBe(true);
        expect(chains.some(item => item.canHandle("wb.page"))).toBe(false);
    });

    it("throws for a missing folder, a folder of another model and a failed read (R116)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });
        failingFolderReads.add("folder-sibling");
        const chain = getFolderChain(context);

        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-missing" })
        ).rejects.toThrow("Folder not found!");
        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-book" })
        ).rejects.toThrow('Folder "folder-book" is not a folder of "cms.author".');
        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-sibling" })
        ).rejects.toThrow("Storage is down.");
    });

    it("throws for an empty folder id or one containing #", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        const chain = getFolderChain(context);

        for (const folderId of ["", "folder-child#0001"]) {
            await expect(
                chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId })
            ).rejects.toThrow(`"${folderId}" is not a valid folder id.`);
        }
    });

    it("answers folder read access with the user's permissions (R121)", async () => {
        const context = await createAdminContext();
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        const access = getReadAccess(context);

        const inRoot = await canUserReadInFolder(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: null
        });
        const inRootById = await canUserReadInFolder(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "root"
        });
        const inFolder = await canUserReadInFolder(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "folder-1"
        });
        const inLockedFolder = await canUserReadInFolder(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "folder-locked"
        });

        expect(inRoot).toBe(true);
        expect(inRootById).toBe(true);
        expect(inFolder).toBe(true);
        expect(inLockedFolder).toBe(false);
    });

    it("denies a user without model read or without CMS permissions (R72)", async () => {
        const context = await createAdminContext();
        const access = getReadAccess(context);

        for (const userId of [WRITER.id, NOBODY.id]) {
            const canRead = await canUserReadInFolder(access, {
                userId,
                model: AUTHOR_NAMESPACE,
                folderId: null
            });
            expect(canRead).toBe(false);
        }
    });

    it("denies a user with model read but without group read", async () => {
        const context = await createAdminContext();
        const access = getReadAccess(context);

        const canRead = await canUserReadInFolder(access, {
            userId: NO_GROUP_READER_ID,
            model: AUTHOR_NAMESPACE,
            folderId: null
        });

        expect(canRead).toBe(false);
    });

    it("skips the folder check when folder-level permissions are not in use", async () => {
        const { context } = createContextHandler({
            // Folder-level permissions stay off: the real one is not in use.
            legacyPlugins: [...createExtraModelPlugins()],
            permissionsByIdentity: { [READER.id]: CMS_READER }
        });
        const access = getReadAccess(await context());
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));

        const canRead = await canUserReadInFolder(access, {
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "folder-locked"
        });

        expect(canRead).toBe(true);
    });

    it("denies another app's namespace, a missing or private model and a throwing check (R50)", async () => {
        const context = await createAdminContext();
        const access = getReadAccess(context);
        const ask = (model: string) => {
            return canUserReadInFolder(access, { userId: READER.id, model, folderId: null });
        };

        expect(await ask("wb.page")).toBe(false);
        expect(await ask("cms.missingModel")).toBe(false);
        expect(await ask("cms.secretNote")).toBe(false);
        throwingAccessChecks.add("canReadInFolder");
        expect(await ask(AUTHOR_NAMESPACE)).toBe(false);
    });

    it("finds a folder of a bindable model by id and type (D69, R125)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });

        expect(await folderExists(context, "folder-child", "cms:author")).toBe(true);
        expect(await folderExists(context, "folder-book", "cms:book")).toBe(true);
    });

    it("does not find a missing folder or a folder of another type", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });

        expect(await folderExists(context, "folder-missing", "cms:author")).toBe(false);
        expect(await folderExists(context, "folder-book", "cms:author")).toBe(false);
        // An empty id or one with "#" would be read as a revision by the ACO repository.
        expect(await folderExists(context, "", "cms:author")).toBe(false);
        expect(await folderExists(context, "folder-child#0001", "cms:author")).toBe(false);
    });

    it("does not find folders of another app, an unknown, private or unpublishable model", async () => {
        const context = await createAdminContext();
        addTestFolder({ id: "folder-page", type: "wb:page" });
        addTestFolder({ id: "folder-secret", type: "cms:secretNote" });
        addTestFolder({ id: "folder-setting", type: "cms:siteSetting" });
        addTestFolder({ id: "folder-unknown", type: "cms:unknownModel" });

        expect(await folderExists(context, "folder-page", "wb:page")).toBe(false);
        expect(await folderExists(context, "folder-secret", "cms:secretNote")).toBe(false);
        expect(await folderExists(context, "folder-setting", "cms:siteSetting")).toBe(false);
        expect(await folderExists(context, "folder-unknown", "cms:unknownModel")).toBe(false);
        expect(await folderExists(context, "folder-page", "page")).toBe(false);
    });

    it("throws when the folder read fails", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        failingFolderReads.add("folder-child");

        await expect(folderExists(context, "folder-child", "cms:author")).rejects.toThrow(
            "Storage is down."
        );
    });
});

describe("CMS folder rules in routing", () => {
    afterEach(() => {
        testFolders.clear();
        failingFolderReads.clear();
        folderLevels.clear();
        loggedErrors.length = 0;
    });

    it("routes a review in a descendant folder to the rule's user (R113, R114)", async () => {
        addAuthorFolders();
        const admin = await createUserContext({
            legacyPlugins: [registerTestUsers],
            permissionsByIdentity: { [REVIEWER.id]: CMS_READER }
        });
        expectOk(
            await storeWorkflow(
                admin,
                createWorkflowValuesWithAssignment({
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        {
                            id: "rule-1",
                            conditions: {
                                folder: {
                                    id: "folder-parent",
                                    type: "cms:author",
                                    includeDescendants: true
                                }
                            },
                            target: { type: "user", id: REVIEWER.id }
                        }
                    ]
                })
            )
        );
        const inGrandchild = await createAuthorEntry(admin, {
            name: "Ann",
            folderId: "folder-grandchild"
        });
        const inSibling = await createAuthorEntry(admin, {
            name: "Bob",
            folderId: "folder-sibling"
        });
        const inRoot = await createAuthorEntry(admin, { name: "Cid" });

        const routed = await requestEntryReview(admin, inGrandchild);
        const notMatched = await requestEntryReview(admin, inSibling);
        const rootReview = await requestEntryReview(admin, inRoot);

        expect(routed.currentStepState).toBe("inReview");
        expect(routed.currentOwnerId).toBe(REVIEWER.id);
        expect(routed.steps[0].assignment).toMatchObject({ source: "rule", ruleId: "rule-1" });
        for (const pooled of [notMatched, rootReview]) {
            expect(pooled.currentStepState).toBe("awaiting");
            expect(pooled.currentOwnerId).toBeNull();
            expect(pooled.steps[0].candidateTeamIds).toEqual([REVIEW_TEAM]);
            expect(pooled.steps[0].assignment).toMatchObject({ source: "pool" });
        }
    });

    it("falls through to the pool when the folder chain read fails (R116)", async () => {
        addAuthorFolders();
        failingFolderReads.add("folder-child");
        const admin = await createUserContext({
            legacyPlugins: [registerTestUsers, captureLoggedErrors],
            permissionsByIdentity: { [REVIEWER.id]: CMS_READER }
        });
        expectOk(
            await storeWorkflow(
                admin,
                createWorkflowValuesWithAssignment({
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        {
                            id: "rule-1",
                            conditions: {
                                folder: {
                                    id: "folder-parent",
                                    type: "cms:author",
                                    includeDescendants: true
                                }
                            },
                            target: { type: "user", id: REVIEWER.id }
                        }
                    ]
                })
            )
        );
        const entry = await createAuthorEntry(admin, { name: "Ann", folderId: "folder-child" });

        const review = await requestEntryReview(admin, entry);

        expect(review.currentStepState).toBe("awaiting");
        expect(review.currentOwnerId).toBeNull();
        expect(review.steps[0].assignment).toMatchObject({
            source: "pool",
            reason: "Routing failed; the step went to the pool."
        });
        expect(loggedErrors.map(item => item.message)).toEqual([
            "Routing failed; the step went to the pool."
        ]);
    });
});
