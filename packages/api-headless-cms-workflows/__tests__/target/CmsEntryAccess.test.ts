import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
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
import { CMS_READER_WITHOUT_GROUP_READ } from "~tests/__helpers/permissions.js";
import { createApiKeyIdentity, NOBODY, READER, WRITER } from "~tests/__helpers/identities.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";
import { FakeGetFlp } from "~tests/__helpers/FakeGetFlp.js";

const registerFakeFlp = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
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
        const locked = await createAuthorEntry(admin, {
            name: "Locked",
            folderId: "folder-locked"
        });
        const viewed = await createAuthorEntry(admin, {
            name: "Viewed",
            folderId: "folder-viewed"
        });
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

        expect(namespaces[0].resolve(await getAuthorModel(context))).toBe(AUTHOR_NAMESPACE);
        // The workflows' own private models (and WB pages without the WB package) have none.
        expect(namespaces[0].resolve(reviewModel)).toBeNull();
    });

    it("refuses a user who can read the model and entries but not the group (R72)", async () => {
        const entry = await createAuthorEntry(await createUserContext(), { name: "Ann" });
        const admin = await createAccess({});
        const target = await admin.targets.read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });
        const { access } = await createAccess({
            identity: READER,
            permissions: CMS_READER_WITHOUT_GROUP_READ
        });

        expect(await admin.access.canRead(target!)).toBe(true);
        expect(await access.canRead(target!)).toBe(false);
    });

    it("finds no target in a private model's cms.* namespace (R52)", async () => {
        const { context } = createContextHandler({
            legacyPlugins: [registerFakeFlp],
            modifyModel: model => {
                return { ...model, isPrivate: true };
            }
        });
        const ctx = await context();
        const entry = await createAuthorEntry(ctx, { name: "Ann" });

        const target = await ctx.container.resolve(CmsEntryTargetReader).read({
            model: AUTHOR_NAMESPACE,
            targetRevisionId: entry.id
        });

        expect(target).toBeNull();
    });
});
