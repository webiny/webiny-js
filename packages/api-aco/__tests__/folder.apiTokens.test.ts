import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { expectNotAuthorized } from "./utils/expectNotAuthorized";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityApiToken: SecurityIdentity = { id: "2", type: "api-token", displayName: "API Token" };

const LIST_FLP_TARGETS = /* GraphQL */ `
    query ListFolderLevelPermissionsTargets {
        aco {
            listFolderLevelPermissionsTargets {
                data {
                    id
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

describe("Folders - API Tokens", () => {
    it("should allow API tokens to read folders, but not FLP targets or mutations", async () => {
        const gqlIdentityA = useGraphQlHandler({ identity: identityA });
        const gqlIdentityApiToken = useGraphQlHandler({
            identity: identityApiToken,
            permissions: [{ name: "cms.*" }]
        });

        const folder = await gqlIdentityA.aco
            .createFolder({ data: { title: "Folder A", slug: "folder-a", type: "demo" } })
            .then(([response]) => response.data.aco.createFolder.data);

        await expect(
            gqlIdentityApiToken.aco
                .listFolders({ where: { type: "demo" } })
                .then(([response]) => response.data.aco.listFolders)
        ).resolves.toMatchObject({
            data: [{ id: folder.id, title: "Folder A" }],
            error: null
        });

        await expect(
            gqlIdentityApiToken.aco
                .getFolder({ id: folder.id })
                .then(([response]) => response.data.aco.getFolder)
        ).resolves.toMatchObject({
            data: { id: folder.id },
            error: null
        });

        await expectNotAuthorized(
            gqlIdentityApiToken
                .invoke({ body: { query: LIST_FLP_TARGETS } })
                .then(([response]) => response.data.aco.listFolderLevelPermissionsTargets)
        );

        await expectNotAuthorized(
            gqlIdentityApiToken.aco
                .createFolder({ data: { title: "Folder B", slug: "folder-b", type: "demo" } })
                .then(([response]) => response.data.aco.createFolder)
        );

        await expectNotAuthorized(
            gqlIdentityApiToken.aco
                .updateFolder({ id: folder.id, data: { title: "Updated" } })
                .then(([response]) => response.data.aco.updateFolder)
        );

        await expectNotAuthorized(
            gqlIdentityApiToken.aco
                .deleteFolder({ id: folder.id })
                .then(([response]) => response.data.aco.deleteFolder)
        );
    });

    it("should not allow anonymous users to read folders", async () => {
        const gqlAnonymous = useGraphQlHandler({ identity: null });

        await expectNotAuthorized(
            gqlAnonymous.aco
                .listFolders({ where: { type: "demo" } })
                .then(([response]) => response.data.aco.listFolders)
        );
    });
});
