import { hasScope } from "@webiny/api-security";
import resolveLogin from "./userResolvers/login";
import resolveGetCurrentUser from "./userResolvers/getCurrentUser";
import resolveUpdateCurrentSecurityUser from "./userResolvers/updateCurrentUser";
import resolveCreateUser from "./userResolvers/createUser";
import resolveUpdateUser from "./userResolvers/updateUser";
import resolveDeleteUser from "./userResolvers/deleteUser";
import resolveCreatePAT from "./userResolvers/PersonalAccessTokens/createPAT";
import resolveUpdatePAT from "./userResolvers/PersonalAccessTokens/updatePAT";
import resolveDeletePAT from "./userResolvers/PersonalAccessTokens/deletePAT";
import listUsers from "./userResolvers/listUsers";
import getUser from "./userResolvers/getUser";

const userFetcher = ctx => ctx.models.SecurityUser;

export default {
    typeDefs: /* GraphQL */ `
        # Personal Access Token type
        type PersonalAccessToken {
            id: ID
            user: SecurityUser
            name: String
            token: String
            createdOn: DateTime
        }

        input PersonalAccessTokenInput {
            name: String
        }

        type PersonalAccessTokenCreationData {
            pat: PersonalAccessToken
            # The full token - you only receive it once!
            token: String
        }

        type PersonalAccessTokenCreationResponse {
            data: PersonalAccessTokenCreationData
            error: SecurityUserError
        }

        type PersonalAccessTokenResponse {
            data: PersonalAccessToken
            error: SecurityUserError
        }

        type SecurityIdentity {
            id: ID
            login: String
            permissions: [JSON]
            email: String
            firstName: String
            lastName: String
            fullName: String
            avatar: JSON
            gravatar: String
        }

        type SecurityUser @key(fields: "id") {
            id: ID
            email: String
            firstName: String
            lastName: String
            fullName: String
            gravatar: String
            avatar: JSON
            enabled: Boolean
            group: SecurityGroup
            permissions: [JSON]
            personalAccessTokens: [PersonalAccessToken]
            createdOn: DateTime
        }

        # Contains user settings by specific key, ex: search-filters.
        type SecurityUserSettings {
            key: String
            data: JSON
        }

        # This input type is used by administrators to update other user's accounts
        input SecurityUserInput {
            email: String
            firstName: String
            lastName: String
            avatar: JSON
            enabled: Boolean
            group: ID
        }

        # This input type is used by the user who is updating his own account
        input SecurityCurrentUserInput {
            email: String
            firstName: String
            lastName: String
            avatar: JSON
        }

        type SecurityUserResponse {
            data: SecurityUser
            error: SecurityUserError
        }

        input SecurityUserSearchInput {
            query: String
            fields: [String]
            operator: String
        }

        type SecurityUserError {
            code: String
            message: String
            data: JSON
        }

        type SecurityUserDeleteResponse {
            data: Boolean
            error: SecurityUserError
        }

        type SecurityUserListResponse {
            data: [SecurityUser]
            meta: SecurityListMeta
            error: SecurityUserError
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityQuery {
            "Get current user"
            getCurrentUser: SecurityUserResponse

            "Get a single user by id or specific search criteria"
            getUser(id: ID, login: String): SecurityUserResponse

            "Get a list of users"
            listUsers(
                where: JSON
                sort: JSON
                search: SecurityUserSearchInput
                limit: Int
                after: String
                before: String
            ): SecurityUserListResponse
        }

        extend type SecurityMutation {
            "Login using ID token obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse

            "Update current user"
            updateCurrentUser(data: SecurityCurrentUserInput!): SecurityUserResponse

            createUser(data: SecurityUserInput!): SecurityUserResponse

            updateUser(id: ID!, data: SecurityUserInput!): SecurityUserResponse

            deleteUser(id: ID!): SecurityUserDeleteResponse

            createPAT(name: String!, userId: ID): PersonalAccessTokenCreationResponse

            updatePAT(id: ID!, data: PersonalAccessTokenInput!): PersonalAccessTokenResponse

            deletePAT(id: ID!): SecurityUserDeleteResponse
        }
    `,
    resolvers: {
        PersonalAccessToken: {
            token: pat => {
                return pat.token.substr(-4);
            }
        },
        SecurityUser: {
            __resolveReference(reference, context) {
                return userFetcher(context).findById(reference.id);
            },
            fullName(user) {
                return `${user.firstName} ${user.lastName}`;
            },
            async avatar(user) {
                return user.avatar;
            },
            async group(user, args, context) {
                return await context.groups.get(user.group);
            },
            async permissions(_, args, context) {
                return context.security.getPermissions();
            }
        },
        SecurityIdentity: {
            fullName(user) {
                return `${user.firstName} ${user.lastName}`;
            },
            login: (_, args, context) => {
                return context.security.getIdentity().login;
            },
            async avatar(user) {
                return user.avatar;
            },
            permissions: (_, args, context) => {
                return context.security.getPermissions();
            }
        },
        SecurityQuery: {
            getCurrentUser: resolveGetCurrentUser,
            getUser: hasScope("security.user.manage")(getUser),
            listUsers: hasScope("security.user.manage")(listUsers)
        },
        SecurityMutation: {
            login: resolveLogin,
            updateCurrentUser: resolveUpdateCurrentSecurityUser,
            createUser: hasScope("security.user.manage")(resolveCreateUser),
            updateUser: hasScope("security.user.manage")(resolveUpdateUser),
            deleteUser: hasScope("security.user.manage")(resolveDeleteUser),
            createPAT: hasScope("security.user.manage")(resolveCreatePAT),
            updatePAT: hasScope("security.user.manage")(resolveUpdatePAT),
            deletePAT: hasScope("security.user.manage")(resolveDeletePAT)
        }
    }
};
