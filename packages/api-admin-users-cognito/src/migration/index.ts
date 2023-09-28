import {
    CognitoIdentityProvider,
    UserType,
    ListUsersResponse
} from "@webiny/aws-sdk/client-cognito-identity-provider";
import { ApiKey, Group } from "@webiny/api-security/types";
import {
    createApiKeyEntity,
    createGroupEntity,
    createUserEntity,
    createLinkEntity
} from "./entities";
import { AdminUser, AdminUsersContext, CreateUserInput } from "~/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";

interface OldLink {
    id: string;
    group: {
        slug: string;
    };
}

const userPoolId = process.env.COGNITO_USER_POOL_ID as string;

async function listAllCognitoUsers(cognito: CognitoIdentityProvider) {
    const users: UserType[] = [];
    let paginationToken: string | undefined = undefined;
    while (true) {
        const { Users, PaginationToken } = (await cognito.listUsers({
            UserPoolId: userPoolId,
            AttributesToGet: ["sub", "email"],
            PaginationToken: paginationToken
        })) as ListUsersResponse;

        if (!Users) {
            continue;
        }
        Users.forEach(user => users.push(user));

        if (PaginationToken) {
            paginationToken = PaginationToken;
        } else {
            break;
        }
    }

    return users;
}

export const migration = (context: AdminUsersContext) => {
    const { security, tenancy, adminUsers } = context;

    if (!tenancy.getCurrentTenant()) {
        return;
    }

    // Override `getVersion` method for this migration only.
    const getVersion = adminUsers.getVersion;
    adminUsers.getVersion = async () => {
        const version = await getVersion();

        if (version) {
            return version;
        }

        const securityVersion = await security.getVersion();

        // If it's a new project, `securityVersion` should match the current Webiny version.
        // If so, we let installers work as intended, by returning `null`, which means "not installed".
        if (securityVersion === context.WEBINY_VERSION || !securityVersion) {
            return null;
        }

        // Pretend `adminUsers` app is installed, and let the first `login` mutation trigger the migration.
        return context.WEBINY_VERSION;
    };

    security.onLogin.subscribe(async ({ identity }) => {
        security.disableAuthorization();
        // Try loading user by ID.
        const user = await adminUsers.getUser({ where: { id: identity.id } });

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

        // Create a map of old user ids to group slug
        const oldUser2group: Record<string, string> = oldLinks.reduce(
            (acc, item) => ({ ...acc, [item.id]: item.group.slug }),
            {}
        );

        // 2. Load legacy users using a dedicated dynamodb-toolbox entity
        const oldUserItems = Object.keys(oldUser2group).map(userId => {
            return legacyUsers.getBatch({ PK: `U#${userId}`, SK: "A" });
        });

        const oldUsers = await batchReadAll<AdminUser>({ table, items: oldUserItems });

        // 3. Fetch data from Cognito, and use user's `sub` as the new user `id`
        const cognito = new CognitoIdentityProvider({ region: process.env.COGNITO_REGION });

        const cognitoUsers = await listAllCognitoUsers(cognito);

        // 4. Store users using the new `adminUsers` app
        const newUsers: CreateUserInput[] = oldUsers
            .map(oldUser => {
                const cognitoUser = cognitoUsers.find(cu => {
                    if (!cu.Attributes) {
                        return false;
                    }
                    return cu.Attributes.some(
                        attr => attr.Name === "email" && attr.Value === oldUser.id
                    );
                });
                if (!cognitoUser) {
                    return null;
                }
                const subAttr = (cognitoUser.Attributes || []).find(attr => attr.Name === "sub");
                /**
                 * TODO @ts-refactor @pavel
                 * What happens in case of subAttr not existing (or value is undefined/null):
                 */
                const sub = subAttr ? subAttr.Value : undefined;
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
            })
            .filter(Boolean) as CreateUserInput[];

        // Cognito users already exist, and we should not abort user creation when Cognito throws an error.
        const originalPublish = adminUsers.onUserBeforeCreate.publish;
        adminUsers.onUserBeforeCreate.publish = async event => {
            try {
                await originalPublish(event);
            } catch (err) {
                // Ignore error
            }
        };

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
        await security.setVersion(context.WEBINY_VERSION);
        await adminUsers.setVersion(context.WEBINY_VERSION);
        security.enableAuthorization();
    });
};
