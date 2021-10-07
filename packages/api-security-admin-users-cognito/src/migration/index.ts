import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { ApiKey, Group, SecurityContext } from "@webiny/api-security/types";
import {
    createApiKeyEntity,
    createGroupEntity,
    createUserEntity,
    createLinkEntity
} from "./entities";
import { AdminUser, AdminUsersContext, CreateUserInput } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";

type Context = SecurityContext & TenancyContext & AdminUsersContext;

interface OldLink {
    id: string;
    group: {
        slug: string;
    };
}

const userPoolId = process.env.COGNITO_USER_POOL_ID;

async function listAllCognitoUsers(cognito: CognitoIdentityServiceProvider) {
    const users = [];
    let paginationToken = null;
    while (true) {
        const { Users, PaginationToken } = await cognito
            .listUsers({
                UserPoolId: userPoolId,
                AttributesToGet: ["sub", "email"],
                PaginationToken: paginationToken
            })
            .promise();

        Users.forEach(user => users.push(user));

        if (PaginationToken) {
            paginationToken = PaginationToken;
        } else {
            break;
        }
    }

    return users;
}

export const migration = (context: Context) => {
    const { security, tenancy, adminUsers } = context;

    // Override `getVersion` method for this migration only.
    const getVersion = adminUsers.getVersion;
    adminUsers.getVersion = async () => {
        const version = await getVersion();

        console.log(`adminUsers.getVersion()`, version);

        if (version) {
            return version;
        }

        const securityVersion = await security.getVersion();

        // If it's a new project, `securityVersion` should match the current Webiny version.
        // If so, we let installers work as intended, by returning `null`, which means "not installed".
        if (securityVersion === context.WEBINY_VERSION) {
            return null;
        }

        console.log(`Pretend adminUsers is installed!`);
        // Pretend `adminUsers` app is installed, and let the first `login` mutation trigger the migration.
        return context.WEBINY_VERSION;
    };

    security.onLogin.subscribe(async ({ identity }) => {
        console.log(`Check if migration is necessary...`);
        security.disableAuthorization();
        // Try loading user by ID.
        const user = await adminUsers.getUser({ where: { id: identity.id } });

        console.log(`User by ID: ${identity.id}`);
        console.log(JSON.stringify(user, null, 2));

        // If it exists, the data is already migrated.
        if (user) {
            return;
        }

        // Make sure this really is a previously installed system.
        const securityVersion = await security.getVersion();

        // If it's a new project, `securityVersion` should match the current Webiny version.
        // If so, migration is not executed.
        if (securityVersion === context.WEBINY_VERSION) {
            return;
        }

        console.log("=== EXECUTE MIGRATION ===");

        const adminUsersStorage = adminUsers.getStorageOperations();
        const securityStorage = security.getStorageOperations();

        // @ts-ignore
        const table = adminUsersStorage.getTable();

        const tenant = tenancy.getCurrentTenant();

        // Setup entities that match the old data structure
        const legacyUsers = createUserEntity(table);
        const legacyLinks = createLinkEntity(table);
        const legacyGroups = createGroupEntity(table);
        const legacyApiKeys = createApiKeyEntity(table);

        // Migrate groups
        // 1. Load legacy groups using a dedicated entity
        const oldGroups = await queryAll<Group>({
            entity: legacyGroups,
            partitionKey: `T#${tenant.id}`,
            options: {
                beginsWith: "G#"
            }
        });

        console.log("OLD GROUPS");
        console.log(JSON.stringify(oldGroups, null, 2));

        // 2. Store groups using the new `security` app
        const newGroupsBySlug: Record<string, Group> = {};
        for (const group of oldGroups) {
            const newGroup = await security.createGroup({
                name: group.name,
                slug: group.slug,
                description: group.description,
                system: group.system,
                // Rename user permission
                permissions: group.permissions.map(permission => {
                    if (permission.name === "security.user") {
                        permission.name = "adminUsers.user";
                    }
                    return permission;
                })
            });

            newGroupsBySlug[newGroup.slug] = newGroup;
        }

        console.log("NEW GROUPS");
        console.log(JSON.stringify(newGroupsBySlug, null, 2));

        // Migrate users
        // 1. Load links to tenants
        const oldLinks = await queryAll<OldLink>({
            entity: legacyLinks,
            partitionKey: `T#${tenant.id}`,
            options: {
                index: "GSI1",
                beginsWith: "G#"
            }
        });

        console.log("OLD LINKS");
        console.log(JSON.stringify(oldLinks, null, 2));

        // Create a map of old user ids to group slug
        const oldUser2group = oldLinks.reduce(
            (acc, item) => ({ ...acc, [item.id]: item.group.slug }),
            {}
        );

        // 2. Load legacy users using a dedicated dynamodb-toolbox entity
        const oldUserItems = Object.keys(oldUser2group).map(userId => {
            return legacyUsers.getBatch({ PK: `U#${userId}`, SK: "A" });
        });

        const oldUsers = await batchReadAll<AdminUser>({ table, items: oldUserItems });

        console.log("OLD USERS");
        console.log(JSON.stringify(oldUsers, null, 2));

        // 3. Fetch data from Cognito, and use user's `sub` as the new user `id`
        const cognito = new CognitoIdentityServiceProvider({ region: process.env.COGNITO_REGION });

        const cognitoUsers = await listAllCognitoUsers(cognito);

        console.log("COGNITO USERS");
        console.log(JSON.stringify(cognitoUsers, null, 2));

        // 4. Store users using the new `adminUsers` app
        const newUsers: CreateUserInput[] = oldUsers.map(oldUser => {
            console.log(`Looking for ${oldUser.id}...`);
            const cognitoUser = cognitoUsers.find(cu => {
                return !!cu.Attributes.find(
                    attr => attr.Name === "email" && attr.Value === oldUser.id
                );
            });
            console.log(JSON.stringify(cognitoUser, null, 2));
            const sub = cognitoUser.Attributes.find(attr => attr.Name === "sub").Value;
            return {
                id: sub,
                email: oldUser.id,
                avatar: oldUser.avatar,
                firstName: oldUser.firstName,
                lastName: oldUser.lastName,
                group: newGroupsBySlug[oldUser2group[oldUser.id]].id,
                createdBy: oldUser.createdBy,
                createdOn: oldUser.createdOn,
                // Set any password value to make TS happy. It will not be used anyway.
                password: ""
            };
        });

        console.log("NEW USERS");
        console.log(JSON.stringify(newUsers, null, 2));

        for (const user of newUsers) {
            await adminUsers.createUser(user);
        }

        // Migrate API keys
        // 1. Load legacy API keys using a dedicated entity
        const oldApiKeys = await queryAll<ApiKey>({
            entity: legacyApiKeys,
            partitionKey: `T#${tenant.id}`,
            options: {
                index: "GSI1",
                beginsWith: "API_KEY#"
            }
        });

        // 2. Store API keys using the new `security` app
        for (const apiKey of oldApiKeys) {
            await securityStorage.createApiKey({ apiKey });
        }

        // Set new app versions
        console.log("SET VERSIONS");
        await security.setVersion(context.WEBINY_VERSION);
        await adminUsers.setVersion(context.WEBINY_VERSION);
        security.enableAuthorization();
    });
};
