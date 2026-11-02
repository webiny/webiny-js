import { describe, expect, test } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA = new AuthenticatedIdentity({ id: "1", type: "admin", displayName: "A" });

describe("Deleting a CMS folder with entries", () => {
    test("returns Aco/Folder/NotEmpty when the folder holds an entry and no child folders", async () => {
        const gql = useGraphQlHandler({ identity: identityA });
        const modelGroup = await gql.cms.createTestModelGroup();
        const model = await gql.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gql.aco
            .createFolder({
                data: { title: "Folder A", slug: "folder-a", type: `cms:${model.modelId}` }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        await gql.cms.createEntry(model, {
            data: { values: { title: "Test" }, wbyAco_location: { folderId: folder.id } }
        });

        await expect(
            gql.aco
                .deleteFolder({ id: folder.id })
                .then(([response]) => response.data.aco.deleteFolder)
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/NotEmpty", message: "Folder is not empty." }
        });
    });
});
