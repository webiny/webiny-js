import { afterEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, getPageModel } from "~tests/__helpers/pages.js";
import {
    createApiKeyIdentity,
    NOBODY,
    READER,
    WB_DELETE_ONLY,
    WB_DELETER,
    WB_OWN_DELETER,
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

        expect(nobodyTarget).not.toBeNull();
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

    it("refuses read and delete without page read permission", async () => {
        const page = await createPage(await createUserContext(), { title: "Page A" });
        const writeOnly = await createAccess(WRITER, WB_WRITE_ONLY);
        const deleteOnly = await createAccess(WRITER, WB_DELETE_ONLY);

        const writeOnlyTarget = await writeOnly.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });
        const deleteOnlyTarget = await deleteOnly.targets.read({
            model: "wb.page",
            targetRevisionId: page.id
        });

        expect(writeOnlyTarget).not.toBeNull();
        expect(deleteOnlyTarget).not.toBeNull();
        expect(await writeOnly.access.canRead(writeOnlyTarget!)).toBe(false);
        expect(await deleteOnly.access.canDelete(deleteOnlyTarget!)).toBe(false);
    });

    it("lets an own-only delete permission pass the entity-level delete check (R86)", async () => {
        const own = await createAccess(WRITER, WB_OWN_DELETER);
        const writer = await createAccess(WRITER, WB_WRITER);

        expect(await own.access.canDeleteAnyPage()).toBe(true);
        expect(await writer.access.canDeleteAnyPage()).toBe(false);
    });

    it("does not apply folder-level permissions to API keys", async () => {
        const page = await createPage(await createUserContext(), {
            title: "Locked",
            folderId: "folder-locked"
        });
        folderLevels.set("folder-locked", new Map([["api-key-1", "no-access"]]));
        const { targets, access } = await createAccess(createApiKeyIdentity(WB_READER), []);

        const target = await targets.read({ model: "wb.page", targetRevisionId: page.id });

        expect(target).not.toBeNull();
        expect(await access.canRead(target!)).toBe(true);
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
