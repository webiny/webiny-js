import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { ContextPlugin } from "@webiny/api";
import { ModelAccessGuard } from "~/features/contentModel/ModelAccessGuard/index.js";
import type { CmsContext } from "~/types/index.js";
import { identityA } from "./security/utils";

const TENANT = "root";

const QUERY = /* GraphQL */ `
    query ListUsersWhoCanReadEntries($modelId: ID!) {
        listUsersWhoCanReadEntries(modelId: $modelId) {
            data {
                id
                displayName
            }
            error {
                code
                message
            }
        }
    }
`;

const readAll: SecurityPermission[] = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" },
    { name: "cms.contentEntry", rwd: "r" }
];

const readOwnEntries: SecurityPermission[] = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" },
    { name: "cms.contentEntry", rwd: "rwd", own: true }
];

const readOtherModel: SecurityPermission[] = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r", models: ["someOtherModel"] },
    { name: "cms.contentEntry", rwd: "r" }
];

const roles: Record<string, SecurityPermission[]> = {
    fullAccess: [{ name: "*" }],
    readAll,
    readOwnEntries,
    readOtherModel,
    fileManagerOnly: [{ name: "fm.*" }]
};

interface SeedUser {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    teams?: string[];
}

const users: SeedUser[] = [
    { id: "zed", displayName: "Zed", roles: ["fullAccess"] },
    { id: "ann", displayName: "Ann", roles: ["readAll"] },
    { id: "bob", displayName: "Bob", roles: ["readOwnEntries"] },
    { id: "cid", displayName: "Cid", roles: ["readOtherModel"] },
    { id: "dan", displayName: "Dan", roles: ["fileManagerOnly"] },
    { id: "eve", displayName: "Eve", teams: ["readers"] },
    { id: "fay", displayName: "", firstName: "Fay", lastName: "Doe", roles: ["readAll"] },
    { id: "gus", displayName: "Gus" },
    { id: "hal", displayName: "", roles: ["readAll"] }
];

class AllowingModelAccessGuard implements ModelAccessGuard.Interface {
    canHandle(model: { modelId: string }): boolean {
        return model.modelId === "testModel";
    }

    async canAccess(): Promise<boolean> {
        return true;
    }
}

const guardPlugin = new ContextPlugin<CmsContext>(async context => {
    context.container.register(
        ModelAccessGuard.createImplementation({
            implementation: AllowingModelAccessGuard,
            dependencies: []
        })
    );
});

const seedUsersRolesAndTeams = async () => {
    const { storageOperations } = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const security = storageOperations.securityStorageOperations;

    for (const [id, permissions] of Object.entries(roles)) {
        await security.createRole({
            role: {
                id,
                slug: id,
                name: id,
                description: "",
                system: false,
                permissions,
                createdOn: new Date().toISOString(),
                createdBy: null,
                tenant: TENANT
            }
        });
    }

    await security.createTeam({
        team: {
            id: "readers",
            slug: "readers",
            name: "Readers",
            description: "",
            system: false,
            roles: ["readAll"],
            createdOn: new Date().toISOString(),
            createdBy: null,
            tenant: TENANT
        }
    });

    for (const user of users) {
        await storageOperations.usersStorageOperations.createUser({
            user: {
                email: `${user.id}@webiny.local`,
                roles: [],
                teams: [],
                ...user,
                tenant: TENANT,
                createdOn: new Date().toISOString(),
                createdBy: null
            }
        });
    }
};

const setup = async () => {
    const { manage } = useTestModelHandler({ identity: identityA });
    await manage.setup();
    await seedUsersRolesAndTeams();
};

const listUsersWhoCanReadEntries = async (
    params: Parameters<typeof useTestModelHandler>[0],
    modelId = "testModel"
) => {
    const { manage } = useTestModelHandler(params);
    const [response] = await manage.invoke({
        body: { query: QUERY, variables: { modelId } }
    });
    return response.data.listUsersWhoCanReadEntries;
};

describe("listUsersWhoCanReadEntries", () => {
    it("lists the users who can read the model's entries, by name", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({ identity: identityA });

        expect(result).toEqual({
            data: [
                // Can read entries through the "readAll" role.
                { id: "ann", displayName: "Ann" },
                // Can read their own entries.
                { id: "bob", displayName: "Bob" },
                // Can read entries through the "readers" team.
                { id: "eve", displayName: "Eve" },
                // No display name, so first and last name.
                { id: "fay", displayName: "Fay Doe" },
                // No name at all, so the ID. The e-mail is never returned.
                { id: "hal", displayName: "hal" },
                // Full access.
                { id: "zed", displayName: "Zed" }
            ],
            error: null
        });
    });

    it("returns only the caller for a model that has a model access guard", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({
            identity: identityA,
            plugins: [guardPlugin]
        });

        expect(result).toEqual({
            data: [{ id: identityA.id, displayName: identityA.displayName }],
            error: null
        });
    });

    it("returns only the caller when the caller can only read their own entries", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({
            identity: { ...identityA, id: "bob", displayName: "Bob" },
            permissions: readOwnEntries
        });

        expect(result).toEqual({
            data: [{ id: "bob", displayName: "Bob" }],
            error: null
        });
    });

    it("refuses a caller who cannot read the model's entries", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({
            identity: { ...identityA, id: "cid", displayName: "Cid" },
            permissions: readOtherModel
        });

        expect(result).toEqual({
            data: null,
            error: {
                code: "Cms/Entry/NotAuthorized",
                message: `Not allowed to access "testModel" entries.`
            }
        });
    });

    it("refuses a caller who can read the model but not its entries", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({
            identity: { ...identityA, id: "dan", displayName: "Dan" },
            permissions: [
                { name: "cms.endpoint.manage" },
                { name: "cms.contentModelGroup", rwd: "r" },
                { name: "cms.contentModel", rwd: "r" }
            ]
        });

        expect(result).toEqual({
            data: null,
            error: {
                code: "Cms/Entry/NotAuthorized",
                message: `Not allowed to access "testModel" entries.`
            }
        });
    });

    it("refuses an unknown model with the same error as an unreadable one", async () => {
        await setup();

        const result = await listUsersWhoCanReadEntries({ identity: identityA }, "doesNotExist");

        expect(result).toEqual({
            data: null,
            error: {
                code: "Cms/Entry/NotAuthorized",
                message: `Not allowed to access "doesNotExist" entries.`
            }
        });
    });
});
