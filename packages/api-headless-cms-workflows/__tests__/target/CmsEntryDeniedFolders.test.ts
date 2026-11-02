import { afterEach, describe, expect, it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createApiKeyIdentity, REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import {
    folderLevels,
    folderPermissionLists
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { CmsEntryDeniedFolders } from "~/features/target/CmsEntryDeniedFolders/index.js";

describe("CmsEntryDeniedFolders (Q77)", () => {
    afterEach(() => {
        folderLevels.clear();
        folderPermissionLists.count = 0;
    });

    it("lists the folders the identity cannot read, once per folder type for the request", async () => {
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        folderLevels.set("folder-viewer", new Map([[REVIEWER.id, "viewer"]]));
        folderLevels.set("folder-others", new Map([["user-someone", "owner"]]));
        const context = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const deniedFolders = context.container.resolve(CmsEntryDeniedFolders);

        const first = await deniedFolders.listDeniedFolderIds(["author"]);
        const again = await deniedFolders.listDeniedFolderIds(["author", "author"]);
        const twoModels = await deniedFolders.listDeniedFolderIds(["author", "book"]);

        expect(first.sort()).toEqual(["folder-locked", "folder-others"]);
        expect(again.sort()).toEqual(["folder-locked", "folder-others"]);
        // The fake keeps no folder types, so the second type lists the same folders again.
        expect(twoModels).toHaveLength(4);
        // "author" once, then "book" once: the request cache answers the rest.
        expect(folderPermissionLists.count).toBe(2);
    });

    it("lists nothing, without reading, when folder-level permissions are not in use", async () => {
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const context = await createUserContext({
            identity: createApiKeyIdentity(CMS_READER),
            permissions: CMS_READER
        });

        const denied = await context.container
            .resolve(CmsEntryDeniedFolders)
            .listDeniedFolderIds(["author"]);

        expect(denied).toEqual([]);
        expect(folderPermissionLists.count).toBe(0);
    });
});
