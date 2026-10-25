import { afterEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/index.js";
import type { ReviewStepAssignmentConfig } from "@webiny/api-workflows/domain/workflow/types.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflowWithAssignment } from "~tests/__helpers/engine.js";
import {
    ADMIN,
    NOBODY,
    READER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    WB_READER,
    WB_WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, failFolderReads, registerAco } from "~tests/__helpers/aco.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";
import { canUserReadInFolder } from "~tests/__helpers/userReadChecks.js";

/** Real ACO folders; the default admin (`*`) unless given; READER reads pages. */
const createAcoContext = (params: UserContextParams = {}) => {
    return createUserContext({
        ...params,
        permissionsByIdentity: { [READER.id]: WB_READER },
        legacyPlugins: [registerAco, throwOnAccessChecks, ...(params.legacyPlugins ?? [])]
    });
};

const getFolderChain = (context: CmsContext): ReviewTargetFolderChain.Interface => {
    return context.container
        .resolveAll(ReviewTargetFolderChain)
        .find(item => item.canHandle("wb.page"))!;
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle("wb.page"))!;
};

const folderExists = (context: CmsContext, id: string) => {
    return context.container.resolve(WbPageFolderExistsService).exists(id);
};

/** Marketing > Campaigns > Spring and Legal (root level), all page folders. */
const createPageFolders = async (context: CmsContext) => {
    const marketing = await createWbFolder(context, { title: "Marketing", slug: "marketing" });
    const campaigns = await createWbFolder(context, {
        title: "Campaigns",
        slug: "campaigns",
        parentId: marketing.id
    });
    const spring = await createWbFolder(context, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    const legal = await createWbFolder(context, { title: "Legal", slug: "legal" });
    return { marketing, campaigns, spring, legal };
};

/** One rule: pages under the given folder (descendants included) go to REVIEWER. */
const folderRule = (folderId: string): ReviewStepAssignmentConfig => {
    return {
        strategy: "none",
        allowManualPick: false,
        rules: [
            {
                id: "rule-campaigns",
                conditions: { folder: { id: folderId, type: "wb:page", includeDescendants: true } },
                target: { type: "user", id: REVIEWER.id }
            }
        ]
    };
};

describe("WB folder port", () => {
    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists a page folder and its ancestors, nearest first (R114)", async () => {
        const context = await createAcoContext();
        const { marketing, campaigns, spring } = await createPageFolders(context);
        const chain = getFolderChain(context);

        const nested = await chain.listFolderChainIds({ model: "wb.page", folderId: spring.id });
        const topLevel = await chain.listFolderChainIds({
            model: "wb.page",
            folderId: marketing.id
        });

        expect(nested).toEqual([spring.id, campaigns.id, marketing.id]);
        expect(topLevel).toEqual([marketing.id]);
    });

    it("reads the chain as a page author without CMS permissions (private folder model)", async () => {
        const admin = await createAcoContext();
        const { marketing, campaigns } = await createPageFolders(admin);
        const requester = await createAcoContext({ identity: REQUESTER, permissions: WB_WRITER });

        const ids = await getFolderChain(requester).listFolderChainIds({
            model: "wb.page",
            folderId: campaigns.id
        });

        expect(ids).toEqual([campaigns.id, marketing.id]);
    });

    it("answers only for the wb.page namespace", async () => {
        const chain = getFolderChain(await createAcoContext());

        expect(chain.canHandle("wb.page")).toBe(true);
        expect(chain.canHandle("cms.article")).toBe(false);
    });

    it("throws for a missing folder and a folder of another type (R116)", async () => {
        const context = await createAcoContext();
        const articles = await createWbFolder(context, {
            title: "Articles",
            slug: "articles",
            type: "cms:article"
        });
        const chain = getFolderChain(context);

        await expect(
            chain.listFolderChainIds({ model: "wb.page", folderId: "folder-missing" })
        ).rejects.toThrow("Folder not found!");
        await expect(
            chain.listFolderChainIds({ model: "wb.page", folderId: articles.id })
        ).rejects.toThrow(`Folder "${articles.id}" is not a Website Builder page folder.`);
    });

    it("throws for an empty folder id or one with # before any read (R116)", async () => {
        const context = await createAcoContext({ legacyPlugins: [failFolderReads] });
        const chain = getFolderChain(context);

        // The failing folder read would reject with "Storage is down." if it were reached.
        await expect(chain.listFolderChainIds({ model: "wb.page", folderId: "" })).rejects.toThrow(
            '"" is not a valid folder id.'
        );
        await expect(
            chain.listFolderChainIds({ model: "wb.page", folderId: "folder-1#0001" })
        ).rejects.toThrow('"folder-1#0001" is not a valid folder id.');
    });

    it("throws when the folder read fails", async () => {
        const context = await createAcoContext({ legacyPlugins: [failFolderReads] });

        await expect(
            getFolderChain(context).listFolderChainIds({ model: "wb.page", folderId: "folder-1" })
        ).rejects.toThrow("Storage is down.");
    });

    it("answers folder read access with the user's permissions (R121)", async () => {
        const access = getReadAccess(await createAcoContext());
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        folderLevels.set("root", new Map([[READER.id, "no-access"]]));
        const ask = (folderId: string | null) => {
            return canUserReadInFolder(access, { userId: READER.id, model: "wb.page", folderId });
        };

        const inRoot = await ask(null);
        const inRootById = await ask("root");
        const inFolder = await ask("folder-1");
        const inLockedFolder = await ask("folder-locked");

        expect({ inRoot, inRootById, inFolder, inLockedFolder }).toEqual({
            inRoot: true,
            inRootById: true,
            inFolder: true,
            inLockedFolder: false
        });
    });

    it("denies a user without page permissions", async () => {
        const access = getReadAccess(await createAcoContext());

        const canRead = await canUserReadInFolder(access, {
            userId: NOBODY.id,
            model: "wb.page",
            folderId: null
        });

        expect(canRead).toBe(false);
    });

    it("denies another app's namespace and a throwing check (R50)", async () => {
        const access = getReadAccess(await createAcoContext());
        const ask = (model: string) => {
            return canUserReadInFolder(access, { userId: READER.id, model, folderId: "folder-1" });
        };

        expect(await ask("cms.article")).toBe(false);
        throwingAccessChecks.add("canReadInFolder");
        expect(await ask("wb.page")).toBe(false);
    });

    it("answers as the user while the request runs as a reader", async () => {
        const context = await createAcoContext({ identity: READER, permissions: WB_READER });
        folderLevels.set("folder-1", new Map([[READER.id, "viewer"]]));
        const access = getReadAccess(context);

        const reader = await canUserReadInFolder(access, {
            userId: READER.id,
            model: "wb.page",
            folderId: "folder-1"
        });
        const nobody = await canUserReadInFolder(access, {
            userId: NOBODY.id,
            model: "wb.page",
            folderId: "folder-1"
        });

        expect({ reader, nobody }).toEqual({ reader: true, nobody: false });
        expect(context.container.resolve(IdentityContext).getIdentity().id).toBe(READER.id);
    });

    it("finds a page folder by id, without folder-level permissions (D69, R125)", async () => {
        const admin = await createAcoContext();
        const { spring } = await createPageFolders(admin);
        folderLevels.set(
            spring.id,
            new Map([
                [ADMIN.id, "owner"],
                [READER.id, "no-access"]
            ])
        );
        const reader = await createAcoContext({ identity: READER, permissions: WB_READER });

        // Control: the permission-applying ACO read refuses READER, so the grant is in force.
        const readerGet = await reader.container.resolve(GetFolderUseCase).execute(spring.id);
        const adminGet = await admin.container.resolve(GetFolderUseCase).execute(spring.id);
        expect(readerGet.isFail() && readerGet.error.code).toBe("Aco/Folder/NotAuthorizedError");
        expect(adminGet.isOk()).toBe(true);

        expect(await folderExists(admin, spring.id)).toBe(true);
        expect(await folderExists(reader, spring.id)).toBe(true);
    });

    it("does not find a missing folder, a folder of another type or a revision-like id", async () => {
        const context = await createAcoContext();
        const { spring } = await createPageFolders(context);
        const articles = await createWbFolder(context, {
            title: "Articles",
            slug: "articles",
            type: "cms:article"
        });

        expect(await folderExists(context, "folder-missing")).toBe(false);
        expect(await folderExists(context, articles.id)).toBe(false);
        expect(await folderExists(context, `${spring.id}#0001`)).toBe(false);
        expect(await folderExists(context, "")).toBe(false);
    });

    it("throws when the folder read fails", async () => {
        const context = await createAcoContext({ legacyPlugins: [failFolderReads] });

        await expect(folderExists(context, "folder-1")).rejects.toThrow("Storage is down.");
    });
});

describe("WB folder rules in routing", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("routes a review of a page in a descendant folder to the rule's user (R113, R114)", async () => {
        const admin = await createUserContext({
            legacyPlugins: [registerAco, registerTestUsers],
            permissionsByIdentity: { [REVIEWER.id]: WB_READER }
        });
        const { campaigns, spring, legal } = await createPageFolders(admin);
        await storeWbWorkflowWithAssignment(admin, folderRule(campaigns.id));
        const inSpring = await createPage(admin, { title: "Spring", folderId: spring.id });
        const inLegal = await createPage(admin, { title: "Legal", folderId: legal.id });
        const inRoot = await createPage(admin, { title: "Home" });

        const routed = await requestPageReview(admin, inSpring);
        const notMatched = await requestPageReview(admin, inLegal);
        const rootReview = await requestPageReview(admin, inRoot);

        expect(routed.currentStepState).toBe("inReview");
        expect(routed.currentOwnerId).toBe(REVIEWER.id);
        expect(routed.steps[0].assignment).toMatchObject({
            source: "rule",
            ruleId: "rule-campaigns"
        });
        for (const pooled of [notMatched, rootReview]) {
            expect(pooled.currentStepState).toBe("awaiting");
            expect(pooled.currentOwnerId).toBeNull();
            expect(pooled.steps[0].candidateTeamIds).toEqual([REVIEW_TEAM]);
            expect(pooled.steps[0].assignment).toMatchObject({ source: "pool" });
        }
    });

    it("falls through to the pool when the folder chain read fails (R116)", async () => {
        const setup = await createUserContext({ legacyPlugins: [registerAco] });
        const { campaigns, spring } = await createPageFolders(setup);
        const admin = await createUserContext({
            legacyPlugins: [registerAco, registerTestUsers, failFolderReads],
            permissionsByIdentity: { [REVIEWER.id]: WB_READER }
        });
        await storeWbWorkflowWithAssignment(admin, folderRule(campaigns.id));
        const page = await createPage(admin, { title: "Spring", folderId: spring.id });

        const review = await requestPageReview(admin, page);

        expect(review.currentStepState).toBe("awaiting");
        expect(review.currentOwnerId).toBeNull();
        expect(review.steps[0].assignment).toMatchObject({
            source: "pool",
            reason: "Routing failed; the step went to the pool."
        });
    });
});
